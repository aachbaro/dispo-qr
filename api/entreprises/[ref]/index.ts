// api/entreprises/[ref]/index.ts
// -------------------------------------------------------------
// Gestion d’une entreprise (publique ou privée)
// -------------------------------------------------------------
//
// 📍 Endpoints :
//   - GET    /api/entreprises/[ref] → lecture publique ou privée
//   - PUT    /api/entreprises/[ref] → mise à jour (owner/admin)
//   - DELETE /api/entreprises/[ref] → suppression (owner/admin)
//
// 🔒 Accès :
//   - Public → GET limité aux champs non sensibles
//   - Auth (owner/admin) → accès complet + update/delete
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../_supabase.js";
import type { Tables } from "../../../types/database.js";
import { getUserFromToken } from "../../utils/auth.js";
import { canAccessSensitive, findEntreprise} from "../../_lib/entreprise.js";

// ----------------------
// Handler
// ----------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { ref } = req.query;
  if (!ref || typeof ref !== "string") {
    return res.status(400).json({ error: "❌ Référence entreprise invalide" });
  }

  try {
    const user = await getUserFromToken(req);

    // ----------------------
    // GET → Lecture entreprise
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
      let data: Partial<Tables<"entreprise">> = {
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

      // Champs sensibles si owner/admin
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
    // PUT → Mise à jour
    // ----------------------
    if (req.method === "PUT") {
      if (!user) return res.status(401).json({ error: "❌ Non authentifié" });

      const { data: entreprise } = await findEntreprise(ref);
      if (!entreprise) {
        return res.status(404).json({ error: "Entreprise non trouvée" });
      }
      if (!canAccessSensitive(user, entreprise)) {
        return res.status(403).json({ error: "Accès interdit" });
      }

      const updates =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body;

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
    // DELETE → Suppression
    // ----------------------
    if (req.method === "DELETE") {
      if (!user) return res.status(401).json({ error: "❌ Non authentifié" });

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
      return res.status(200).json({ message: "✅ Entreprise supprimée" });
    }

    return res.status(405).json({ error: "❌ Méthode non autorisée" });
  } catch (err: any) {
    console.error("❌ Exception entreprise/index:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
