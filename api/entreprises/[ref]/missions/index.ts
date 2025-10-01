// api/entreprises/[ref]/missions/index.ts
// -------------------------------------------------------------
// Gestion des missions d’une entreprise
// -------------------------------------------------------------
//
// 📌 Description :
//   - Liste ou crée des missions liées à une entreprise
//
// 📍 Endpoints :
//   - GET  /api/entreprises/[ref]/missions → liste missions (+ slots)
//   - POST /api/entreprises/[ref]/missions → crée mission (+ slots)
//
// 🔒 Règles d’accès :
//   - Auth JWT obligatoire pour POST
//   - GET :
//       • Owner/admin → accès complet
//       • Public → missions validées/completed seulement
//
// ⚠️ Remarques :
//   - ref = slug (string) ou id (number)
//   - Statuts possibles = ENUM mission_status
//   - Slots insérés en cascade
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../../_supabase.js";
import type { Tables } from "../../../../types/database.js";

// ----------------------
// Helpers
// ----------------------
async function getUserFromToken(req: VercelRequest) {
  const auth = req.headers.authorization;
  if (!auth) return null;
  const token = auth.split(" ")[1];
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

function canAccessSensitive(
  user: any,
  entreprise: Tables<"entreprise">
): boolean {
  if (!user) return false;
  if (user.id === entreprise.user_id) return true;
  if (user.app_metadata?.role === "admin") return true;
  return false;
}

async function findEntreprise(ref: string) {
  let query = supabaseAdmin.from("entreprise").select("*");
  if (!isNaN(Number(ref))) query = query.eq("id", Number(ref));
  else query = query.eq("slug", ref);
  return query.single<Tables<"entreprise">>();
}

// ----------------------
// Handler principal
// ----------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { ref } = req.query;
  if (!ref || typeof ref !== "string") {
    return res.status(400).json({ error: "❌ Paramètre entreprise invalide" });
  }

  try {
    const user = await getUserFromToken(req);

    // 🔍 Entreprise
    const { data: entreprise, error: entrepriseError } = await findEntreprise(
      ref
    );
    if (entrepriseError) {
      console.error("❌ Erreur fetch entreprise:", entrepriseError.message);
      return res.status(500).json({ error: entrepriseError.message });
    }
    if (!entreprise)
      return res.status(404).json({ error: "❌ Entreprise non trouvée" });

    // ----------------------
    // GET → Liste missions (+ slots)
    // ----------------------
    if (req.method === "GET") {
      let query = supabaseAdmin
        .from("missions")
        .select("*, slots(*)")
        .eq("entreprise_id", entreprise.id)
        .order("created_at", { ascending: false });

      if (!canAccessSensitive(user, entreprise)) {
        query = query.in("status", ["validated", "completed"]);
      }

      const { data, error } = await query;
      if (error) return res.status(500).json({ error: error.message });

      return res.status(200).json({ missions: data });
    }

    // ----------------------
    // POST → Créer mission (+ slots)
    // ----------------------
    if (req.method === "POST") {
      const { slots, ...payload } = req.body as Partial<Tables<"missions">> & {
        slots?: Array<Pick<Tables<"slots">, "start" | "end" | "title">>;
      };

      // statut forcé si externe
      const isOwnerOrAdmin = user && canAccessSensitive(user, entreprise);
      const clientId = user ? user.id : null;

      const { data: mission, error: missionError } = await supabaseAdmin
        .from("missions")
        .insert({
          ...payload,
          entreprise_id: entreprise.id,
          client_id: clientId,
          status: isOwnerOrAdmin ? payload.status || "proposed" : "proposed", // ⚠️ externes ne peuvent que proposer
        })
        .select()
        .single<Tables<"missions">>();

      if (missionError)
        return res.status(500).json({ error: missionError.message });

      if (Array.isArray(slots) && slots.length > 0) {
        const insertSlots = slots.map((s) => ({
          start: s.start,
          end: s.end,
          title: s.title || null,
          mission_id: mission.id,
          entreprise_id: entreprise.id,
        }));
        const { error: slotError } = await supabaseAdmin
          .from("slots")
          .insert(insertSlots);
        if (slotError) {
          console.error("❌ Erreur création slots:", slotError.message);
          return res.status(500).json({ error: slotError.message });
        }
      }

      return res.status(201).json({ mission });
    }

    return res.status(405).json({ error: "❌ Méthode non autorisée" });
  } catch (err: any) {
    console.error("❌ Exception handler missions:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
