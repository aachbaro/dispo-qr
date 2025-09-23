// ================================================
// File: api/entreprises/index.ts
// Description: Liste toutes les entreprises publiques
// Accessible en GET uniquement, sans authentification
// Retourne uniquement les infos non sensibles (public)
// ================================================

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../_supabase.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const { data, error } = await supabaseAdmin
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
        taux_horaire,
        devise,
        created_at
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Erreur fetch entreprises:", error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ entreprises: data });
  } catch (err: any) {
    console.error("❌ Exception GET entreprises:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
