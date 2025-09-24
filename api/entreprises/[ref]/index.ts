// api/entreprises/[ref]/index.ts
// -------------------------------------------------------------
// Route entreprise (publique ou privée) : /api/entreprises/[ref]
//
// - GET :
//   -> Public : retourne uniquement les infos visibles publiquement
//   -> Privé (owner ou admin) : retourne toutes les infos sensibles
//
// - PUT : Mettre à jour une entreprise (owner ou admin uniquement)
// - DELETE : Supprimer une entreprise (owner ou admin uniquement)
//
// ⚠️ Vérifie le token JWT pour différencier public vs privé
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../_supabase.js";

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

function canAccessSensitive(user: any, entreprise: any): boolean {
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
// Handler
// ----------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { ref } = req.query;

  if (!ref || typeof ref !== "string") {
    return res.status(400).json({ error: "Référence entreprise invalide" });
  }

  try {
    const user = await getUserFromToken(req);

    // ----------------------
    // GET
    // ----------------------
    if (req.method === "GET") {
      const { data: entreprise, error } = await findEntreprise(ref);
      if (error) {
        console.error("❌ Erreur fetch entreprise:", error.message);
        return res.status(500).json({ error: error.message });
      }
      if (!entreprise) {
        return res.status(404).json({ error: "Entreprise non trouvée" });
      }

      // Champs publics
      let data: any = {
        id: entreprise.id,
        slug: entreprise.slug,
        nom: entreprise.nom,
        prenom: entreprise.prenom,
        adresse_ligne1: entreprise.adresse_ligne1,
        adresse_ligne2: entreprise.adresse_ligne2,
        ville: entreprise.ville,
        code_postal: entreprise.code_postal,
        pays: entreprise.pays,
        email: entreprise.email,
        telephone: entreprise.telephone,
        taux_horaire: entreprise.taux_horaire,
        devise: entreprise.devise,
        created_at: entreprise.created_at,
        stripe_account_id: entreprise.stripe_account_id,
      };

      // Champs privés si owner/admin
      if (canAccessSensitive(user, entreprise)) {
        data = {
          ...data,
          siret: entreprise.siret,
          statut_juridique: entreprise.statut_juridique,
          tva_intracom: entreprise.tva_intracom,
          mention_tva: entreprise.mention_tva,
          iban: entreprise.iban,
          bic: entreprise.bic,
          conditions_paiement: entreprise.conditions_paiement,
          penalites_retard: entreprise.penalites_retard,
          updated_at: entreprise.updated_at,
        };
      }

      return res.status(200).json({ entreprise: data });
    }

    // ----------------------
    // PUT
    // ----------------------
    if (req.method === "PUT") {
      if (!user) return res.status(401).json({ error: "Non authentifié" });

      const { data: entreprise } = await findEntreprise(ref);
      if (!entreprise) {
        return res.status(404).json({ error: "Entreprise non trouvée" });
      }
      if (!canAccessSensitive(user, entreprise)) {
        return res.status(403).json({ error: "Accès interdit" });
      }

      const updates = req.body;
      const { data, error } = await supabaseAdmin
        .from("entreprise")
        .update(updates)
        .eq("id", entreprise.id)
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ entreprise: data });
    }

    // ----------------------
    // DELETE
    // ----------------------
    if (req.method === "DELETE") {
      if (!user) return res.status(401).json({ error: "Non authentifié" });

      const { data: entreprise } = await findEntreprise(ref);
      if (!entreprise) {
        return res.status(404).json({ error: "Entreprise non trouvée" });
      }
      if (!canAccessSensitive(user, entreprise)) {
        return res.status(403).json({ error: "Accès interdit" });
      }

      const { error } = await supabaseAdmin
        .from("entreprise")
        .delete()
        .eq("id", entreprise.id);

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ message: "Entreprise supprimée" });
    }

    return res.status(405).json({ error: "Méthode non autorisée" });
  } catch (err: any) {
    console.error("❌ Exception handler entreprise:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
