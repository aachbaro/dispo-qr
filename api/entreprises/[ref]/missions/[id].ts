// api/entreprises/[ref]/missions/[id].ts
// -------------------------------------------------------------
// Gestion d’une mission spécifique
// -------------------------------------------------------------
//
// 📌 Description :
//   - Met à jour ou supprime une mission
//   - Gère aussi la mise à jour des slots liés
//
// 📍 Endpoints :
//   - PUT    /api/entreprises/[ref]/missions/[id]
//   - DELETE /api/entreprises/[ref]/missions/[id]
//
// 🔒 Règles d’accès :
//   - Authentification JWT obligatoire
//   - Réservé au propriétaire de l’entreprise ou admin
//
// ⚠️ Remarques :
//   - ref = slug (string) ou id (number) de l’entreprise
//   - id  = identifiant numérique mission
//   - Statuts valides = ENUM mission_status
//   - DELETE → cascade supprime les slots liés
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../../_supabase.js";
import type { Tables } from "../../../../types/database.js";
import { getUserFromToken } from "../../../utils/auth.js";
import {
  canAccessSensitive,
  findEntreprise,
} from "../../../_lib/entreprise.js";

// ----------------------
// Handler principal
// ----------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { ref, id } = req.query;

  if (!ref || typeof ref !== "string" || !id || typeof id !== "string") {
    return res.status(400).json({ error: "❌ Paramètres invalides" });
  }

  try {
    // 🔐 Auth
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: "❌ Non authentifié" });

    // 🔎 Entreprise
    const { data: entreprise, error: entrepriseError } = await findEntreprise(
      ref
    );
    if (entrepriseError) {
      console.error("❌ Erreur fetch entreprise:", entrepriseError.message);
      return res.status(500).json({ error: entrepriseError.message });
    }
    if (!entreprise)
      return res.status(404).json({ error: "❌ Entreprise introuvable" });
    if (!canAccessSensitive(user, entreprise))
      return res.status(403).json({ error: "❌ Accès interdit" });

    // 🔎 Mission
    const missionId = Number(id);
    if (isNaN(missionId))
      return res.status(400).json({ error: "❌ ID mission invalide" });

    const { data: mission, error: missionError } = await supabaseAdmin
      .from("missions")
      .select("*")
      .eq("id", missionId)
      .eq("entreprise_id", entreprise.id)
      .single<Tables<"missions">>();

    if (missionError) {
      console.error("❌ Erreur fetch mission:", missionError.message);
      return res.status(500).json({ error: missionError.message });
    }
    if (!mission)
      return res.status(404).json({ error: "❌ Mission introuvable" });

    // ----------------------
    // PUT → Update mission + slots
    // ----------------------
    if (req.method === "PUT") {
      const { slots, ...updates } = req.body as Partial<Tables<"missions">> & {
        slots?: Array<Pick<Tables<"slots">, "start" | "end" | "title">>;
      };

      if (
        updates.status &&
        ![
          "proposed",
          "validated",
          "pending_payment",
          "paid",
          "completed",
          "refused",
          "realized",
        ].includes(updates.status)
      ) {
        return res.status(400).json({ error: "❌ Statut invalide" });
      }

      // 1️⃣ Mise à jour mission
      const { data: updatedMission, error: updateError } = await supabaseAdmin
        .from("missions")
        .update(updates)
        .eq("id", missionId)
        .eq("entreprise_id", entreprise.id)
        .select()
        .single<Tables<"missions">>();

      if (updateError)
        return res.status(500).json({ error: updateError.message });

      // 2️⃣ Mise à jour slots si fournis
      if (Array.isArray(slots)) {
        await supabaseAdmin.from("slots").delete().eq("mission_id", missionId);

        if (slots.length > 0) {
          const insertSlots = slots.map((s) => ({
            start: s.start,
            end: s.end,
            title: s.title || null,
            mission_id: missionId,
            entreprise_id: entreprise.id,
          }));
          const { error: slotError } = await supabaseAdmin
            .from("slots")
            .insert(insertSlots);
          if (slotError) {
            console.error("❌ Erreur update slots:", slotError.message);
            return res.status(500).json({ error: slotError.message });
          }
        }
      }

      return res.status(200).json({ mission: updatedMission });
    }

    // ----------------------
    // DELETE → Supprimer mission
    // ----------------------
    if (req.method === "DELETE") {
      const { error } = await supabaseAdmin
        .from("missions")
        .delete()
        .eq("id", missionId)
        .eq("entreprise_id", entreprise.id);

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ message: "✅ Mission supprimée" });
    }

    return res.status(405).json({ error: "❌ Méthode non autorisée" });
  } catch (err: any) {
    console.error("❌ Exception mission/[id]:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
