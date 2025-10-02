// api/entreprises/[ref]/factures/[id]/index.ts
// -------------------------------------------------------------
// Endpoint REST pour une facture spécifique
// -------------------------------------------------------------
//
// 📌 Description :
//   - GET    → récupérer une facture (+ mission + slots)
//   - PUT    → mettre à jour une facture
//   - DELETE → supprimer une facture
//
// 🔒 Règles d’accès :
//   - Auth obligatoire (JWT dans Authorization header)
//   - Propriétaire entreprise ou admin
//
// ⚠️ Remarques :
//   - Le numéro de facture doit être unique dans l’entreprise
//   - Si facture passe en "paid", mission liée = "paid"
//   - DELETE physique (en prod → préférer un statut "cancelled")
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../../../_supabase.js";
import type { Tables, TablesUpdate } from "../../../../../types/database.js";
import { getUserFromToken } from "../../../../utils/auth.js";
import {
  canAccessSensitive,
  findEntreprise,
} from "../../../../_lib/entreprise.js";

// -----------------------------
// Handler principal
// -----------------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { ref, id } = req.query;

  if (!ref || !id || typeof ref !== "string" || typeof id !== "string") {
    return res.status(400).json({ error: "❌ Paramètres invalides" });
  }

  try {
    // 🔐 Vérifier utilisateur
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: "❌ Non authentifié" });

    // 🔎 Charger entreprise
    const { data: entreprise, error: errEntreprise } = await supabaseAdmin
      .from("entreprise")
      .select("*")
      .eq(
        isNaN(Number(ref)) ? "slug" : "id",
        isNaN(Number(ref)) ? ref : Number(ref)
      )
      .single();

    if (errEntreprise || !entreprise) {
      return res.status(404).json({ error: "❌ Entreprise introuvable" });
    }
    if (!canAccessSensitive(user, entreprise)) {
      return res.status(403).json({ error: "❌ Accès interdit" });
    }

    const factureId = Number(id);
    if (isNaN(factureId)) {
      return res.status(400).json({ error: "❌ ID facture invalide" });
    }

    // ----------------------
    // GET → Lire facture
    // ----------------------
    if (req.method === "GET") {
      const { data: facture, error } = await supabaseAdmin
        .from("factures")
        .select("*, missions(*, slots(*))")
        .eq("id", factureId)
        .eq("entreprise_id", entreprise.id)
        .single();

      if (error) return res.status(500).json({ error: error.message });
      if (!facture)
        return res.status(404).json({ error: "❌ Facture introuvable" });

      return res.status(200).json({ facture });
    }

    // ----------------------
    // PUT → Mettre à jour facture
    // ----------------------
    if (req.method === "PUT") {
      const payload = req.body as TablesUpdate<"factures">;

      const { data: facture, error } = await supabaseAdmin
        .from("factures")
        .update({
          ...payload,
          mission_id: payload.mission_id || null,
        })
        .eq("id", factureId)
        .eq("entreprise_id", entreprise.id)
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          return res
            .status(400)
            .json({ error: "❌ Numéro de facture déjà utilisé" });
        }
        return res.status(500).json({ error: error.message });
      }

      // 🔄 Si payé → propager à la mission
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

      return res.status(200).json({ facture });
    }

    // ----------------------
    // DELETE → Supprimer facture
    // ----------------------
    if (req.method === "DELETE") {
      const { error } = await supabaseAdmin
        .from("factures")
        .delete()
        .eq("id", factureId)
        .eq("entreprise_id", entreprise.id);

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ message: "✅ Facture supprimée" });
    }

    return res.status(405).json({ error: "❌ Méthode non autorisée" });
  } catch (err: any) {
    console.error("❌ Exception facture/[id]:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
