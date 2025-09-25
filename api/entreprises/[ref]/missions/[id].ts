// api/entreprises/[ref]/missions/[id].ts
// -------------------------------------------------------------
// Gestion d’une mission spécifique
// -------------------------------------------------------------
//
// 📌 Description :
//   - Permet de mettre à jour ou supprimer une mission
//   - Supporte aussi la mise à jour des slots liés à cette mission
//
// 📍 Endpoints :
//   - PUT    /api/entreprises/[ref]/missions/[id] → update mission + slots
//   - DELETE /api/entreprises/[ref]/missions/[id] → delete mission
//
// 🔒 Règles d’accès :
//   - Authentification JWT obligatoire
//   - Réservé au propriétaire de l’entreprise ou admin
//
// ⚠️ Remarques :
//   - ref = slug (string) ou id (number) de l’entreprise
//   - id  = identifiant numérique de la mission
//   - Les statuts possibles sont ceux définis dans l’ENUM mission_status
//   - Supprimer une mission supprime aussi ses slots (CASCADE)
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../../_supabase.js";

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

function canAccess(user: any, entreprise: any): boolean {
  if (!user) return false;
  if (user.id === entreprise.user_id) return true;
  if (user.app_metadata?.role === "admin") return true;
  return false;
}

async function findEntreprise(ref: string) {
  let query = supabaseAdmin.from("entreprise").select("*");
  if (!isNaN(Number(ref))) {
    query = query.eq("id", Number(ref));
  } else {
    query = query.eq("slug", ref);
  }
  return query.single();
}

// ----------------------
// Handler principal
// ----------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { ref, id } = req.query;

  if (!ref || typeof ref !== "string" || !id || typeof id !== "string") {
    return res.status(400).json({ error: "Paramètres invalides" });
  }

  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    const { data: entreprise, error: entrepriseError } = await findEntreprise(
      ref
    );
    if (entrepriseError) {
      console.error("❌ Erreur fetch entreprise:", entrepriseError.message);
      return res.status(500).json({ error: entrepriseError.message });
    }
    if (!entreprise) {
      return res.status(404).json({ error: "Entreprise non trouvée" });
    }

    if (!canAccess(user, entreprise)) {
      return res.status(403).json({ error: "Accès interdit" });
    }

    const missionId = Number(id);
    if (isNaN(missionId)) {
      return res.status(400).json({ error: "ID mission invalide" });
    }

    // 🔎 Vérifie que la mission existe
    const { data: mission, error: missionError } = await supabaseAdmin
      .from("missions")
      .select("*")
      .eq("id", missionId)
      .eq("entreprise_id", entreprise.id)
      .single();

    if (missionError) {
      console.error("❌ Erreur fetch mission:", missionError.message);
      return res.status(500).json({ error: missionError.message });
    }
    if (!mission) {
      return res.status(404).json({ error: "Mission non trouvée" });
    }

    // ----------------------
    // PUT → Update mission (+ slots si fournis)
    // ----------------------
    if (req.method === "PUT") {
      const { slots, ...updates } = req.body;

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
        return res.status(400).json({ error: "Statut invalide" });
      }

      // 1️⃣ Mise à jour mission
      const { data: updatedMission, error: updateError } = await supabaseAdmin
        .from("missions")
        .update(updates)
        .eq("id", missionId)
        .eq("entreprise_id", entreprise.id)
        .select()
        .single();

      if (updateError)
        return res.status(500).json({ error: updateError.message });

      // 2️⃣ Mise à jour des slots (si fournis)
      if (Array.isArray(slots)) {
        // On supprime les anciens slots
        await supabaseAdmin.from("slots").delete().eq("mission_id", missionId);

        // On insère les nouveaux
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
    // DELETE → Delete mission
    // ----------------------
    if (req.method === "DELETE") {
      const { error } = await supabaseAdmin
        .from("missions")
        .delete()
        .eq("id", missionId)
        .eq("entreprise_id", entreprise.id);

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ message: "Mission supprimée" });
    }

    return res.status(405).json({ error: "Méthode non autorisée" });
  } catch (err: any) {
    console.error("❌ Exception handler mission:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
