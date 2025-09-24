// api/entreprises/[ref]/factures/[id].ts
// -------------------------------------------------------------
// Route facture entreprise : /api/entreprises/[ref]/factures/[id]
//
// - GET    : Récupérer une facture précise
// - PUT    : Mettre à jour une facture
// - DELETE : Supprimer une facture (⚠️ à remplacer par "annuler" en prod)
//
// 🔒 Règles d’accès :
//   - Réservé à l’owner de l’entreprise ou admin
//   - Vérification via JWT (auth.uid lié à entreprise.user_id)
//
// ⚠️ Remarques :
//   - Le numéro de facture doit être unique dans l’entreprise
//   - Une facture peut être liée ou non à une mission
//
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

async function findEntreprise(ref: string) {
  let query = supabaseAdmin.from("entreprise").select("*");

  if (!isNaN(Number(ref))) {
    query = query.eq("id", Number(ref));
  } else {
    query = query.eq("slug", ref);
  }

  return query.single();
}

function canAccess(user: any, entreprise: any): boolean {
  if (!user) return false;
  if (user.id === entreprise.user_id) return true;
  if (user.app_metadata?.role === "admin") return true;
  return false;
}

// ----------------------
// Handler
// ----------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { ref, id } = req.query;

  if (!ref || typeof ref !== "string" || !id || typeof id !== "string") {
    return res.status(400).json({ error: "Paramètres invalides" });
  }

  try {
    const user = await getUserFromToken(req);

    // 🔍 Entreprise
    const { data: entreprise, error: entrepriseError } = await findEntreprise(
      ref
    );
    if (entrepriseError) {
      return res.status(500).json({ error: entrepriseError.message });
    }
    if (!entreprise) {
      return res.status(404).json({ error: "Entreprise non trouvée" });
    }

    if (!canAccess(user, entreprise)) {
      return res.status(403).json({ error: "Accès interdit" });
    }

    // ----------------------
    // GET → Récupérer facture
    // ----------------------
    if (req.method === "GET") {
      const { data, error } = await supabaseAdmin
        .from("factures")
        .select("*")
        .eq("id", Number(id))
        .eq("entreprise_id", entreprise.id)
        .single();

      if (error) return res.status(500).json({ error: error.message });
      if (!data) return res.status(404).json({ error: "Facture introuvable" });

      return res.status(200).json({ facture: data });
    }

    // ----------------------
    // PUT → Mise à jour facture
    // ----------------------
    if (req.method === "PUT") {
      const payload = req.body;

      const toUpdate = {
        ...payload,
        mission_id: payload.mission_id || null,
      };

      const { data, error } = await supabaseAdmin
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

      return res.status(200).json({ facture: data });
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
    console.error("❌ Exception handler facture:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
