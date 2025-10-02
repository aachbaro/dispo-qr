// api/missions/index.ts
// -------------------------------------------------------------
// Endpoint unifié de gestion des missions
// -------------------------------------------------------------
//
// 📌 Description :
//   - GET  /api/missions → liste les missions de l'utilisateur connecté
//   - POST /api/missions → crée une mission pour l'entreprise propriétaire
//
// 🔒 Règles d’accès :
//   - Authentification obligatoire
//   - Rôle "entreprise" (ou freelance/admin) → accès missions de son entreprise
//   - Rôle "client"                   → missions où mission.client_id = user.id
//   - Clients = lecture seule
//
// ⚠️ Remarques :
//   - Réutilise findEntreprise / canAccessSensitive pour vérifier les droits
//   - Retourne toujours les slots associés (mission.slots[])
//   - Ajoute entreprise_slug pour les clients (MissionCard côté front)
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../_supabase.js";
import type { Tables } from "../../types/database.js";
import { getUserFromToken } from "../utils/auth.js";
import { canAccessSensitive, findEntreprise } from "../_lib/entreprise.js";

interface MissionWithSlots extends Tables<"missions"> {
  slots?: Tables<"slots">[];
  entreprise_slug?: string | null;
}

const ENTREPRISE_ROLES = new Set(["entreprise", "freelance", "admin"]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: "❌ Authentification requise" });
    }
    console.log("✅ User authenticated:", user.id);

    const role =
      (user.user_metadata?.role as string | undefined) ||
      (user.app_metadata?.role as string | undefined);

    if (req.method === "GET") {
      if (!role) {
        return res.status(403).json({ error: "❌ Rôle utilisateur manquant" });
      }

      if (ENTREPRISE_ROLES.has(role)) {
        const entrepriseLookup =
          (req.query.entreprise_ref as string | undefined) ||
          (req.query.entreprise_id as string | undefined) ||
          user.user_metadata?.entreprise_id ||
          user.id;

        const { data: entreprise, error: entrepriseError } =
          await findEntreprise(entrepriseLookup);

        if (entrepriseError) {
          console.error("❌ Erreur fetch entreprise:", entrepriseError.message);
          return res.status(500).json({ error: entrepriseError.message });
        }

        if (!entreprise) {
          return res
            .status(404)
            .json({ error: "❌ Entreprise associée introuvable" });
        }

        if (!canAccessSensitive(user, entreprise)) {
          return res.status(403).json({ error: "❌ Accès interdit" });
        }

        const { status } = req.query;
        let query = supabaseAdmin
          .from("missions")
          .select("*, slots(*)")
          .eq("entreprise_id", entreprise.id)
          .order("created_at", { ascending: false });

        if (status && typeof status === "string") {
          query = query.eq("status", status);
        }

        const { data, error } = await query;
        if (error) {
          return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ missions: data as MissionWithSlots[] });
      }

      if (role === "client") {
        const { data, error } = await supabaseAdmin
          .from("missions")
          .select("*, slots(*), entreprise:entreprise_id(slug)")
          .eq("client_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          return res.status(500).json({ error: error.message });
        }

        const missions: MissionWithSlots[] = (data || []).map(
          (mission: any) => {
            const { entreprise, ...rest } = mission;
            return {
              ...rest,
              slots: mission.slots,
              entreprise_slug: entreprise?.slug ?? null,
            } as MissionWithSlots;
          }
        );

        return res.status(200).json({ missions });
      }

      return res.status(403).json({ error: "❌ Rôle non autorisé" });
    }

    if (req.method === "POST") {
      if (!role || !ENTREPRISE_ROLES.has(role)) {
        return res
          .status(403)
          .json({ error: "❌ Accès réservé aux entreprises" });
      }

      const payload =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

      const { slots, ...missionPayload } = payload as Partial<
        Tables<"missions">
      > & {
        slots?: Array<Pick<Tables<"slots">, "start" | "end" | "title">>;
      };

      const { data: entreprise, error: entrepriseError } = await findEntreprise(
        (payload?.entreprise_id as string | number | undefined) ??
          user.user_metadata?.entreprise_id ??
          user.id
      );

      if (entrepriseError) {
        console.error("❌ Erreur fetch entreprise:", entrepriseError.message);
        return res.status(500).json({ error: entrepriseError.message });
      }

      if (!entreprise) {
        return res
          .status(404)
          .json({ error: "❌ Entreprise associée introuvable" });
      }

      if (!canAccessSensitive(user, entreprise)) {
        return res.status(403).json({ error: "❌ Accès interdit" });
      }

      const { data: mission, error: missionError } = await supabaseAdmin
        .from("missions")
        .insert({
          ...missionPayload,
          entreprise_id: entreprise.id,
          status: missionPayload.status || "proposed",
        })
        .select()
        .single<Tables<"missions">>();

      if (missionError) {
        console.error("❌ Erreur création mission:", missionError.message);
        return res.status(500).json({ error: missionError.message });
      }

      let createdSlots: Tables<"slots">[] | undefined;
      if (Array.isArray(slots) && slots.length > 0) {
        const insertSlots = slots.map((slot) => ({
          start: slot.start,
          end: slot.end,
          title: slot.title || null,
          mission_id: mission.id,
          entreprise_id: entreprise.id,
        }));

        const { data: slotData, error: slotError } = await supabaseAdmin
          .from("slots")
          .insert(insertSlots)
          .select();

        if (slotError) {
          console.error("❌ Erreur création slots:", slotError.message);
          return res.status(500).json({ error: slotError.message });
        }

        createdSlots = slotData as Tables<"slots">[];
      }

      const missionWithSlots: MissionWithSlots = {
        ...mission,
        slots: createdSlots,
      };

      return res.status(201).json({ mission: missionWithSlots });
    }

    return res.status(405).json({ error: "❌ Méthode non autorisée" });
  } catch (err: any) {
    console.error("❌ Exception missions/index:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
