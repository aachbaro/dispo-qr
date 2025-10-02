// api/factures/[id].ts
// -------------------------------------------------------------
// Gestion d'une facture spécifique (lecture, mise à jour, suppression)
// -------------------------------------------------------------
//
// 📌 Endpoints :
//   - GET    /api/factures/[id]
//   - PUT    /api/factures/[id]
//   - DELETE /api/factures/[id]
//
// 🔒 Règles d'accès :
//   - Auth obligatoire
//   - Entreprise/freelance/admin → accès complet à leurs factures
//   - Client → lecture des factures liées à ses missions
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../_supabase.js";
import type { Tables, TablesUpdate } from "../../types/database.js";
import { getUserFromToken } from "../utils/auth.js";
import { canAccessSensitive, findEntreprise } from "../_lib/entreprise.js";

const ENTREPRISE_ROLES = new Set(["entreprise", "freelance", "admin"]);
const FACTURE_SELECT =
  "*, missions(*, slots(*), entreprise:entreprise_id(*), client:client_id(*))";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: "❌ Paramètres invalides" });
  }

  const factureId = Number(id);
  if (Number.isNaN(factureId)) {
    return res.status(400).json({ error: "❌ ID facture invalide" });
  }

  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: "❌ Non authentifié" });
    }

    const role =
      (user.user_metadata?.role as string | undefined) ||
      (user.app_metadata?.role as string | undefined);

    const { data: factureRecord, error: factureFetchError } = await supabaseAdmin
      .from("factures")
      .select(FACTURE_SELECT)
      .eq("id", factureId)
      .single<
        Tables<"factures"> & {
          missions?: (Tables<"missions"> & {
            entreprise?: Tables<"entreprise"> | null;
            client?: Tables<"clients"> | null;
          }) | null;
        }
      >();

    if (factureFetchError) {
      console.error("❌ Erreur fetch facture:", factureFetchError.message);
      if (factureFetchError.code === "PGRST116") {
        return res.status(404).json({ error: "❌ Facture introuvable" });
      }
      return res.status(500).json({ error: factureFetchError.message });
    }

    if (!factureRecord) {
      return res.status(404).json({ error: "❌ Facture introuvable" });
    }

    let entreprise = factureRecord.missions?.entreprise || null;

    if (ENTREPRISE_ROLES.has(role ?? "")) {
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
      } else if (!canAccessSensitive(user, entreprise as Tables<"entreprise">)) {
        return res.status(403).json({ error: "❌ Accès interdit" });
      }
    } else if (role === "client") {
      if (factureRecord.missions?.client_id !== user.id) {
        return res.status(403).json({ error: "❌ Accès interdit" });
      }
    } else {
      return res.status(403).json({ error: "❌ Rôle non autorisé" });
    }

    if (req.method === "GET") {
      const { data: facture, error } = await supabaseAdmin
        .from("factures")
        .select(FACTURE_SELECT)
        .eq("id", factureId)
        .single();

      if (error) {
        console.error("❌ Erreur lecture facture:", error.message);
        return res.status(500).json({ error: error.message });
      }

      if (!facture) {
        return res.status(404).json({ error: "❌ Facture introuvable" });
      }

      return res.status(200).json({ facture });
    }

    if (req.method === "PUT") {
      if (!ENTREPRISE_ROLES.has(role ?? "")) {
        return res
          .status(403)
          .json({ error: "❌ Accès réservé au propriétaire" });
      }

      const payload =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

      const { data: facture, error } = await supabaseAdmin
        .from("factures")
        .update({
          ...(payload as TablesUpdate<"factures">),
          mission_id: (payload as TablesUpdate<"factures">).mission_id || null,
        })
        .eq("id", factureId)
        .eq("entreprise_id", factureRecord.entreprise_id)
        .select()
        .single<Tables<"factures">>();

      if (error) {
        if (error.code === "23505") {
          return res
            .status(400)
            .json({ error: "❌ Numéro de facture déjà utilisé" });
        }
        console.error("❌ Erreur update facture:", error.message);
        return res.status(500).json({ error: error.message });
      }

      if (facture && facture.status === "paid" && facture.mission_id) {
        const { error: missionError } = await supabaseAdmin
          .from("missions")
          .update({ status: "paid" })
          .eq("id", facture.mission_id);

        if (missionError) {
          console.error(
            `⚠️ Erreur propagation statut mission ${facture.mission_id}:`,
            missionError.message
          );
        }
      }

      const { data: factureWithRelations, error: fetchUpdatedError } =
        await supabaseAdmin
          .from("factures")
          .select(FACTURE_SELECT)
          .eq("id", factureId)
          .single();

      if (fetchUpdatedError) {
        console.error(
          "❌ Erreur récupération facture mise à jour:",
          fetchUpdatedError.message
        );
        return res.status(500).json({ error: fetchUpdatedError.message });
      }

      return res.status(200).json({ facture: factureWithRelations });
    }

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

    return res.status(405).json({ error: "❌ Méthode non autorisée" });
  } catch (err: any) {
    console.error("❌ Exception facture/[id] :", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
