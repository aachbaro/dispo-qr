// api/missions/[id].ts
// -------------------------------------------------------------
// Gestion d'une mission spécifique (lecture, mise à jour, suppression)
// -------------------------------------------------------------
//
// 📌 Description :
//   - GET    /api/missions/[id]     → lire une mission
//   - PUT    /api/missions/[id]     → modifier une mission
//   - DELETE /api/missions/[id]     → supprimer une mission
//
// 🔒 Règles d'accès :
//   - Auth obligatoire (JWT Supabase)
//   - Rôles :
//       • freelance / entreprise / admin → accès complet
//       • client → lecture seule sur ses missions
//
// ⚠️ Remarques :
//   - Rôle issu de user.role (AuthUser enrichi)
//   - Suppression de user_metadata / app_metadata
//   - canAccessSensitive(user, entreprise) contrôle les droits
//
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../_supabase.js";
import type { Tables } from "../../types/database.js";
import { getUserFromToken } from "../utils/auth.js";
import { canAccessSensitive, findEntreprise } from "../_lib/entreprise.js";
import { notify } from "../_lib/notifications.js";
import type { MissionDTO } from "../_lib/templates/emailTemplates.js";

const ENTREPRISE_ROLES = new Set(["freelance", "entreprise", "admin"]);
const MISSION_SELECT =
  "*, slots(*), entreprise:entreprise_id(*), client:client_id(*)";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res
      .status(400)
      .json({ error: "❌ Paramètre ID manquant ou invalide" });
  }

  const missionId = Number(id);
  if (Number.isNaN(missionId)) {
    return res.status(400).json({ error: "❌ ID mission invalide" });
  }

  try {
    // 🔑 Authentification
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: "❌ Non authentifié" });

    const role = user.role;

    // 📄 Récupération mission complète
    const { data: missionRecord, error: missionFetchError } =
      await supabaseAdmin
        .from("missions")
        .select(MISSION_SELECT)
        .eq("id", missionId)
        .single<
          Tables<"missions"> & {
            entreprise?: Tables<"entreprise"> | null;
            client?: Tables<"clients"> | null;
            slots?: Tables<"slots">[];
          }
        >();

    if (missionFetchError) {
      console.error("❌ Erreur fetch mission:", missionFetchError.message);
      if (missionFetchError.code === "PGRST116") {
        return res.status(404).json({ error: "❌ Mission introuvable" });
      }
      return res.status(500).json({ error: missionFetchError.message });
    }

    if (!missionRecord) {
      return res.status(404).json({ error: "❌ Mission introuvable" });
    }

    // 🏢 Vérification des droits d’accès
    let entreprise = missionRecord.entreprise || null;
    if (ENTREPRISE_ROLES.has(role ?? "")) {
      // Freelance / Admin / Entreprise → accès complet
      if (!entreprise) {
        const { data: entrepriseById, error: entrepriseError } =
          await findEntreprise(missionRecord.entreprise_id);

        if (entrepriseError) {
          console.error(
            "❌ Erreur fetch entreprise mission:",
            entrepriseError.message
          );
          return res.status(500).json({ error: entrepriseError.message });
        }

        if (!entrepriseById || !canAccessSensitive(user, entrepriseById)) {
          return res.status(403).json({ error: "❌ Accès interdit" });
        }

        entreprise = entrepriseById;
      } else if (!canAccessSensitive(user, entreprise)) {
        return res.status(403).json({ error: "❌ Accès interdit" });
      }
    } else if (role === "client") {
      // Client → lecture seule sur ses missions
      if (missionRecord.client_id !== user.id) {
        return res
          .status(403)
          .json({ error: "❌ Accès interdit à cette mission" });
      }
    } else {
      return res.status(403).json({ error: "❌ Rôle non autorisé" });
    }

    // -------------------------------------------------------------
    // 📖 GET → Lecture d’une mission
    // -------------------------------------------------------------
    if (req.method === "GET") {
      return res.status(200).json({ mission: missionRecord });
    }

    // -------------------------------------------------------------
    // ✏️ PUT → Mise à jour d’une mission
    // -------------------------------------------------------------
    if (req.method === "PUT") {
      if (!ENTREPRISE_ROLES.has(role ?? "")) {
        return res
          .status(403)
          .json({ error: "❌ Accès réservé au propriétaire" });
      }

      const payload =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

      const { slots, ...updates } = payload as Partial<Tables<"missions">> & {
        slots?: Array<Pick<Tables<"slots">, "start" | "end" | "title">>;
      };

      // ✅ Validation du statut
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
        return res.status(400).json({ error: "❌ Statut mission invalide" });
      }

      // 🧱 Mise à jour mission principale
      const { error: updateError } = await supabaseAdmin
        .from("missions")
        .update(updates)
        .eq("id", missionId)
        .eq("entreprise_id", missionRecord.entreprise_id)
        .select();

      if (updateError) {
        console.error("❌ Erreur update mission:", updateError.message);
        return res.status(500).json({ error: updateError.message });
      }

      // 🔄 Slots associés
      if (Array.isArray(slots)) {
        await supabaseAdmin.from("slots").delete().eq("mission_id", missionId);

        if (slots.length > 0) {
          const insertSlots = slots.map((slot) => ({
            start: slot.start,
            end: slot.end,
            title: slot.title || null,
            mission_id: missionId,
            entreprise_id: missionRecord.entreprise_id,
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

      // 📦 Renvoi mission mise à jour
      const { data: missionWithRelations, error: fetchUpdatedError } =
        await supabaseAdmin
          .from("missions")
          .select(MISSION_SELECT)
          .eq("id", missionId)
          .single();

      if (fetchUpdatedError) {
        console.error(
          "❌ Erreur fetch mission mise à jour:",
          fetchUpdatedError.message
        );
        return res.status(500).json({ error: fetchUpdatedError.message });
      }

      if (missionWithRelations) {
        const entrepriseForNotify = {
          id: missionWithRelations.entreprise?.id ?? missionRecord.entreprise_id,
          nom: missionWithRelations.entreprise?.nom ?? null,
          email: missionWithRelations.entreprise?.email ?? null,
          slug: missionWithRelations.entreprise?.slug ?? null,
        };

        const slotDtos = missionWithRelations.slots?.map((s) => ({
          start: s.start!,
          end: s.end!,
          title: s.title ?? null,
        }));

        const missionForNotify: MissionDTO & {
          contact_email?: string | null;
          client?: Tables<"clients"> | null;
          client_id?: string | null;
        } = {
          id: missionWithRelations.id,
          status: missionWithRelations.status,
          etablissement: missionWithRelations.etablissement,
          instructions: missionWithRelations.instructions,
          slots: slotDtos,
          contact_email: missionWithRelations.contact_email,
          client: missionWithRelations.client ?? null,
          client_id: missionWithRelations.client_id,
        };

        if (updates.status && updates.status !== missionRecord.status) {
          await notify.missionStatusChangedToClient(
            missionForNotify,
            entrepriseForNotify
          );
        }

        if (Array.isArray(slots)) {
          await notify.missionSlotsRescheduledToClient(
            missionForNotify,
            entrepriseForNotify
          );
        }
      }

      return res.status(200).json({ mission: missionWithRelations });
    }

    // -------------------------------------------------------------
    // 🗑️ DELETE → Suppression d’une mission
    // -------------------------------------------------------------
    if (req.method === "DELETE") {
      if (!ENTREPRISE_ROLES.has(role ?? "")) {
        return res
          .status(403)
          .json({ error: "❌ Accès réservé au propriétaire" });
      }

      const { error } = await supabaseAdmin
        .from("missions")
        .delete()
        .eq("id", missionId)
        .eq("entreprise_id", missionRecord.entreprise_id);

      if (error) {
        console.error("❌ Erreur suppression mission:", error.message);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ message: "✅ Mission supprimée" });
    }

    // -------------------------------------------------------------
    // 🚫 Méthode non autorisée
    // -------------------------------------------------------------
    return res.status(405).json({ error: "❌ Méthode non autorisée" });
  } catch (err: any) {
    console.error("💥 Exception /api/missions/[id]:", err);
    return res.status(500).json({ error: err.message || "Erreur serveur" });
  }
}
