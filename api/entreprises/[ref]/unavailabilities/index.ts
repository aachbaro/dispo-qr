// api/entreprises/[ref]/unavailabilities/index.ts
// -------------------------------------------------------------
// Gestion des indisponibilités d’une entreprise
// -------------------------------------------------------------
//
// 📌 Description :
//   - Liste ou crée des indisponibilités ponctuelles ou récurrentes
//   - Gère l’expansion des récurrences sur la période demandée
//
// 📍 Endpoints :
//   - GET  /api/entreprises/[ref]/unavailabilities?start&end → liste occurrences
//   - POST /api/entreprises/[ref]/unavailabilities → création
//
// 🔒 Règles d’accès :
//   - GET : réservé owner/admin
//   - POST : réservé owner/admin
//
// ⚠️ Remarques :
//   - Les récurrences sont expansées côté serveur (daily, weekly, monthly)
//   - Les dates d’exceptions sont exclues
//   - Structure alignée avec /slots pour cohérence frontend
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../../_supabase.js";
import type { Tables } from "../../../../types/database.js";
import { getUserFromToken } from "../../../utils/auth.js";
import {
  canAccessSensitive,
  findEntreprise,
} from "../../../_lib/entreprise.js";

// -------------------------------------------------------------
// Utils : expansion des récurrences
// -------------------------------------------------------------
function expandRecurrences(
  items: Tables<"unavailabilities">[],
  from: string,
  to: string
): Tables<"unavailabilities">[] {
  const startRange = new Date(from);
  const endRange = new Date(to);
  const results: Tables<"unavailabilities">[] = [];

  for (const item of items) {
    const recurrence = item.recurrence_type;
    const exceptions = (item.exceptions as string[]) || [];

    const recurrenceStart = new Date(item.start_date);
    const recurrenceEnd = item.recurrence_end
      ? new Date(item.recurrence_end)
      : new Date("2100-01-01");

    // si la récurrence est hors période demandée, on skip
    if (recurrenceEnd < startRange || recurrenceStart > endRange) continue;

    const cursor = new Date(startRange);
    while (cursor <= endRange) {
      const isoDate = cursor.toISOString().split("T")[0];
      const dayOfWeek = cursor.getDay(); // 0 = dimanche ... 6 = samedi

      let valid = false;

      switch (recurrence) {
        case "none":
          valid = isoDate === item.start_date.toString();
          break;
        case "daily":
          valid = cursor >= recurrenceStart && cursor <= recurrenceEnd;
          break;
        case "weekly":
          valid =
            cursor >= recurrenceStart &&
            cursor <= recurrenceEnd &&
            dayOfWeek === item.weekday;
          break;
        case "monthly":
          const startDay = new Date(item.start_date).getDate();
          valid =
            cursor >= recurrenceStart &&
            cursor <= recurrenceEnd &&
            cursor.getDate() === startDay;
          break;
      }

      if (valid && !exceptions.includes(isoDate)) {
        results.push({
          ...item,
          start_date: isoDate,
        });
      }

      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return results;
}

// -------------------------------------------------------------
// Handler principal
// -------------------------------------------------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { ref } = req.query;

  console.log("Request method:", req.method);

  if (!ref || typeof ref !== "string") {
    return res
      .status(400)
      .json({ error: "❌ Paramètre ref manquant ou invalide" });
  }

  try {
    const user = await getUserFromToken(req);
    const { data: entreprise, error: entrepriseError } = await findEntreprise(
      ref
    );

    if (entrepriseError) {
      console.error("❌ Erreur fetch entreprise:", entrepriseError.message);
      return res.status(500).json({ error: entrepriseError.message });
    }
    if (!entreprise)
      return res.status(404).json({ error: "❌ Entreprise non trouvée" });

    // -------------------------------------------------------------
    // GET → Liste des indisponibilités (expansées)
    // -------------------------------------------------------------
    if (req.method === "GET") {
      // 🔓 Accès public autorisé
      const { start, end } = req.query;
      if (
        !start ||
        !end ||
        typeof start !== "string" ||
        typeof end !== "string"
      ) {
        return res
          .status(400)
          .json({ error: "❌ Paramètres start et end requis" });
      }

      const { data, error } = await supabaseAdmin
        .from("unavailabilities")
        .select("*")
        .eq("entreprise_id", entreprise.id);

      if (error) {
        console.error("❌ Erreur fetch indisponibilités:", error.message);
        return res.status(500).json({ error: error.message });
      }

      const expanded = expandRecurrences(data ?? [], start, end);
      console.log(
        `Expanded ${expanded.length} unavailabilities between ${start} and ${end}`
      );
      return res.status(200).json({ unavailabilities: expanded });
    }

    // -------------------------------------------------------------
    // POST → Création d’une indisponibilité
    // -------------------------------------------------------------
    if (req.method === "POST") {
      if (!canAccessSensitive(user, entreprise)) {
        return res.status(403).json({ error: "❌ Accès interdit" });
      }

      // 🔒 Sécurise la lecture du body (Vercel parse parfois déjà)
      let payload: any;
      try {
        payload =
          typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      } catch (e) {
        console.error("❌ Body JSON invalide:", e);
        return res.status(400).json({ error: "Invalid JSON payload" });
      }

      if (!payload.start_time || !payload.end_time || !payload.start_date) {
        return res.status(400).json({
          error: "❌ start_time, end_time et start_date sont requis",
        });
      }

      const insertData = {
        entreprise_id: entreprise.id,
        title: payload.title || "Unavailability",
        start_time: payload.start_time,
        end_time: payload.end_time,
        recurrence_type: payload.recurrence_type || "none",
        start_date: payload.start_date,
        recurrence_end: payload.recurrence_end || null,
        weekday: payload.weekday ?? new Date(payload.start_date).getDay(),
        exceptions: payload.exceptions || [],
      };

      const { data, error } = await supabaseAdmin
        .from("unavailabilities")
        .insert(insertData)
        .select()
        .single<Tables<"unavailabilities">>();

      if (error) {
        console.error("❌ Erreur insertion indisponibilité:", error.message);
        return res.status(500).json({ error: error.message });
      }

      return res.status(201).json({ unavailability: data });
    }

    // -------------------------------------------------------------
    // Méthode non autorisée
    // -------------------------------------------------------------
    return res.status(405).json({ error: "❌ Méthode non autorisée" });
  } catch (err: any) {
    console.error("❌ Exception handler unavailabilities:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
