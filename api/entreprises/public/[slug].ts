// api/entreprises/[slug].ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../_supabase.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const { slug } = req.query;

    if (!slug || typeof slug !== "string") {
      return res.status(400).json({ error: "Slug manquant ou invalide" });
    }

    // 🔍 Récupérer l’entreprise par son slug
    const { data: entreprise, error } = await supabaseAdmin
      .from("entreprise")
      .select(
        `
        id,
        slug,
        nom,
        prenom,
        adresse,
        email,
        telephone,
        siret,
        statut_juridique,
        tva_intracom,
        mention_tva,
        taux_horaire,
        devise,
        conditions_paiement,
        penalites_retard,
        created_at,
        updated_at,
        slots (
          id,
          start,
          "end",
          title
        )
        `
      )
      .eq("slug", slug)
      .single();

    if (error) {
      console.error("❌ Erreur fetch entreprise:", error.message);
      return res.status(500).json({ error: error.message });
    }

    if (!entreprise) {
      return res.status(404).json({ error: "Entreprise non trouvée" });
    }

    return res.status(200).json({ data: entreprise });
  } catch (err: any) {
    console.error("❌ Exception GET entreprise:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
