// api/factures/[id].ts
// -------------------------------------------------------------
// Gestion d'une facture spécifique (lecture, mise à jour, suppression)
// -------------------------------------------------------------
//
// 📌 Description :
//   - GET    /api/factures/[id]     → lire une facture
//   - PUT    /api/factures/[id]     → modifier une facture
//   - DELETE /api/factures/[id]     → supprimer une facture
//
// 🔒 Règles d'accès :
//   - Auth obligatoire (JWT Supabase)
//   - Rôle "freelance" / "entreprise" / "admin" → accès complet
//   - Rôle "client" → lecture seule sur ses propres factures
//
// ⚠️ Remarques :
//   - Le rôle est issu de `user.role` (AuthUser enrichi via getUserFromToken)
//   - Les anciens `user_metadata`/`app_metadata` ne sont plus utilisés
//   - `canAccessSensitive(user, entreprise)` contrôle le lien owner/admin
//
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../_supabase.js";
import type { Tables, TablesUpdate } from "../../types/database.js";
import { getUserFromToken } from "../utils/auth.js";
import { canAccessSensitive, findEntreprise } from "../_lib/entreprise.js";

const ENTREPRISE_ROLES = new Set(["freelance", "entreprise", "admin"]);
const FACTURE_SELECT =
  "*, missions(*, slots(*), entreprise:entreprise_id(*), client:client_id(*))";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res
      .status(400)
      .json({ error: "❌ Paramètre ID manquant ou invalide" });
  }

  const factureId = Number(id);
  if (Number.isNaN(factureId)) {
    return res.status(400).json({ error: "❌ ID facture invalide" });
  }

  try {
    // 🔑 Authentification
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: "❌ Non authentifié" });
    }

    const role = user.role;

    // 📄 Récupération de la facture
    const { data: factureRecord, error: factureError } = await supabaseAdmin
      .from("factures")
      .select(FACTURE_SELECT)
      .eq("id", factureId)
      .single<
        Tables<"factures"> & {
          missions?:
            | (Tables<"missions"> & {
                entreprise?: Tables<"entreprise"> | null;
                client?: Tables<"clients"> | null;
              })
            | null;
        }
      >();

    if (factureError) {
      console.error("❌ Erreur fetch facture:", factureError.message);
      if (factureError.code === "PGRST116") {
        return res.status(404).json({ error: "❌ Facture introuvable" });
      }
      return res.status(500).json({ error: factureError.message });
    }

    if (!factureRecord) {
      return res.status(404).json({ error: "❌ Facture introuvable" });
    }

    // 🧾 Détermination de l’entreprise liée
    let entreprise = factureRecord.missions?.entreprise || null;

    // -------------------------------------------------------------
    // 🔒 Vérification des droits d’accès
    // -------------------------------------------------------------

    if (ENTREPRISE_ROLES.has(role ?? "")) {
      // 🔹 Cas freelance / admin / entreprise → accès complet
      if (!entreprise) {
        const { data: entrepriseById, error: entrepriseError } =
          await findEntreprise(factureRecord.entreprise_id);

        if (entrepriseError) {
          console.error(
            "❌ Erreur fetch entreprise facture:",
            entrepriseError.message
          );
          return res.status(500).json({ error: entrepriseError.message });
        }

        if (!entrepriseById || !canAccessSensitive(user, entrepriseById)) {
          return res.status(403).json({ error: "❌ Accès interdit" });
        }

        entreprise = entrepriseById;
      } else if (
        !canAccessSensitive(user, entreprise as Tables<"entreprise">)
      ) {
        return res.status(403).json({ error: "❌ Accès interdit" });
      }
    } else if (role === "client") {
      // 🔹 Cas client → accès lecture seule sur ses factures
      if (factureRecord.missions?.client_id !== user.id) {
        return res
          .status(403)
          .json({ error: "❌ Accès interdit à cette facture" });
      }
    } else {
      return res.status(403).json({ error: "❌ Rôle non autorisé" });
    }

    // -------------------------------------------------------------
    // 📖 GET → Lecture d'une facture
    // -------------------------------------------------------------
    if (req.method === "GET") {
      return res.status(200).json({ facture: factureRecord });
    }

    // -------------------------------------------------------------
    // ✏️ PUT → Mise à jour d'une facture
    // -------------------------------------------------------------
    if (req.method === "PUT") {
      if (!ENTREPRISE_ROLES.has(role ?? "")) {
        return res
          .status(403)
          .json({ error: "❌ Accès réservé au propriétaire" });
      }

      const payload =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

      const { data: updated, error: updateError } = await supabaseAdmin
        .from("factures")
        .update({
          ...(payload as TablesUpdate<"factures">),
          mission_id: (payload as TablesUpdate<"factures">).mission_id || null,
        })
        .eq("id", factureId)
        .eq("entreprise_id", factureRecord.entreprise_id)
        .select()
        .single<Tables<"factures">>();

      if (updateError) {
        if (updateError.code === "23505") {
          return res
            .status(400)
            .json({ error: "❌ Numéro de facture déjà utilisé" });
        }
        console.error("❌ Erreur update facture:", updateError.message);
        return res.status(500).json({ error: updateError.message });
      }

      // 🔄 Propagation du statut payé à la mission
      if (updated && updated.status === "paid" && updated.mission_id) {
        const { error: missionError } = await supabaseAdmin
          .from("missions")
          .update({ status: "paid" })
          .eq("id", updated.mission_id);

        if (missionError) {
          console.error(
            `⚠️ Erreur propagation statut mission ${updated.mission_id}:`,
            missionError.message
          );
        }
      }

      // 📤 Renvoi facture mise à jour avec relations
      const { data: factureWithRelations, error: fetchUpdatedError } =
        await supabaseAdmin
          .from("factures")
          .select(FACTURE_SELECT)
          .eq("id", factureId)
          .single();

      if (fetchUpdatedError) {
        console.error(
          "❌ Erreur fetch facture mise à jour:",
          fetchUpdatedError.message
        );
        return res.status(500).json({ error: fetchUpdatedError.message });
      }

      return res.status(200).json({ facture: factureWithRelations });
    }

    // -------------------------------------------------------------
    // 🗑️ DELETE → Suppression d'une facture
    // -------------------------------------------------------------
    if (req.method === "DELETE") {
      if (!ENTREPRISE_ROLES.has(role ?? "")) {
        return res
          .status(403)
          .json({ error: "❌ Accès réservé au propriétaire" });
      }

      const { error } = await supabaseAdmin
        .from("factures")
        .delete()
        .eq("id", factureId)
        .eq("entreprise_id", factureRecord.entreprise_id);

      if (error) {
        console.error("❌ Erreur suppression facture:", error.message);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ message: "✅ Facture supprimée" });
    }

    // -------------------------------------------------------------
    // 🚫 Méthode non autorisée
    // -------------------------------------------------------------
    return res.status(405).json({ error: "❌ Méthode non autorisée" });
  } catch (err: any) {
    console.error("💥 Exception /api/factures/[id]:", err);
    return res.status(500).json({ error: err.message || "Erreur serveur" });
  }
}
