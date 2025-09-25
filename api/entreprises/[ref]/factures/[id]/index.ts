// api/entreprises/[ref]/factures/[id]/index.ts
// -------------------------------------------------------------
// Endpoint REST pour une facture spécifique
// -------------------------------------------------------------
//
// Routes :
// - GET    /api/entreprises/[ref]/factures/[id] → récupérer une facture
// - PUT    /api/entreprises/[ref]/factures/[id] → mettre à jour une facture
// - DELETE /api/entreprises/[ref]/factures/[id] → supprimer une facture
//
// Étapes :
// 1. Vérifie l’authentification (JWT)
// 2. Vérifie que le user est owner ou admin
// 3. Exécute l’opération demandée sur la facture
//
// ⚠️ Notes :
// - ref = slug (string) ou id (number) de l’entreprise
// - id  = id numérique de la facture
// - Le numéro de facture doit être unique dans l’entreprise
// - En prod, DELETE devrait être remplacé par un "annuler" logique
// - Si la facture est marquée comme "paid", la mission liée passe aussi en "paid"
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../../../_supabase.js";

// -----------------------------
// Helpers
// -----------------------------
async function getUserFromToken(req: VercelRequest) {
  const auth = req.headers.authorization;
  if (!auth) return null;

  const token = auth.split(" ")[1];
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return null;

  return data.user;
}

function canAccess(user: any, entreprise: any) {
  if (!user) return false;
  if (user.id === entreprise.user_id) return true;
  if (user.app_metadata?.role === "admin") return true;
  return false;
}

// -----------------------------
// Handler
// -----------------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { ref, id } = req.query;

  if (!ref || !id || typeof ref !== "string" || typeof id !== "string") {
    return res.status(400).json({ error: "Paramètres invalides" });
  }

  try {
    // 🔐 Vérification utilisateur
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: "Non authentifié" });

    // 🔎 Récupération entreprise
    const { data: entreprise, error: errEntreprise } = await supabaseAdmin
      .from("entreprise")
      .select("*")
      .eq(
        isNaN(Number(ref)) ? "slug" : "id",
        isNaN(Number(ref)) ? ref : Number(ref)
      )
      .single();

    if (errEntreprise || !entreprise) {
      return res.status(404).json({ error: "Entreprise introuvable" });
    }
    if (!canAccess(user, entreprise)) {
      return res.status(403).json({ error: "Accès interdit" });
    }

    // ----------------------
    // GET → Lire facture
    // ----------------------
    if (req.method === "GET") {
      const { data: facture, error } = await supabaseAdmin
        .from("factures")
        .select("*")
        .eq("id", Number(id))
        .eq("entreprise_id", entreprise.id)
        .single();

      if (error) return res.status(500).json({ error: error.message });
      if (!facture) {
        return res.status(404).json({ error: "Facture introuvable" });
      }

      return res.status(200).json({ facture });
    }

    // ----------------------
    // PUT → Mettre à jour facture
    // ----------------------
    if (req.method === "PUT") {
      const payload = req.body ? JSON.parse(req.body) : {};

      const toUpdate = {
        ...payload,
        mission_id: payload.mission_id || null,
      };

      const { data: facture, error } = await supabaseAdmin
        .from("factures")
        .update(toUpdate)
        .eq("id", Number(id))
        .eq("entreprise_id", entreprise.id)
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          return res
            .status(400)
            .json({ error: "Numéro de facture déjà utilisé." });
        }
        return res.status(500).json({ error: error.message });
      }

      // 🔄 Propagation du statut vers la mission si payé
      if (facture && facture.status === "paid" && facture.mission_id) {
        const { error: missionError } = await supabaseAdmin
          .from("missions")
          .update({ status: "paid" })
          .eq("id", facture.mission_id);

        if (missionError) {
          console.error(
            `⚠️ Erreur lors de la mise à jour de la mission liée à la facture ${facture.id}:`,
            missionError
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
        .eq("id", Number(id))
        .eq("entreprise_id", entreprise.id);

      if (error) return res.status(500).json({ error: error.message });
      return res.status(204).end();
    }

    return res.status(405).json({ error: "Méthode non autorisée" });
  } catch (err: any) {
    console.error("❌ Exception facture/[id]:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
