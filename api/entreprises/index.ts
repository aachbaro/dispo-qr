// api/entreprises/index.ts
// -------------------------------------------------------------
// Liste publique des entreprises
// -------------------------------------------------------------
//
// 📍 Endpoint :
//   - GET /api/entreprises
//
// 🔒 Accès :
//   - Public uniquement → pas besoin de token
//   - Retourne seulement les champs non sensibles
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../_supabase.js";
import type { Tables } from "../../types/database.js";

type PublicEntreprise = Pick<
  Tables<"entreprise">,
  | "id"
  | "slug"
  | "nom"
  | "prenom"
  | "adresse_ligne1"
  | "adresse_ligne2"
  | "ville"
  | "code_postal"
  | "pays"
  | "email"
  | "telephone"
  | "taux_horaire"
  | "devise"
  | "created_at"
>;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "❌ Méthode non autorisée" });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("entreprise")
      .select(
        "id, slug, nom, prenom, adresse_ligne1, adresse_ligne2, ville, code_postal, pays, email, telephone, taux_horaire, devise, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Erreur fetch entreprises:", error.message);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ entreprises: data as PublicEntreprise[] });
  } catch (err: any) {
    console.error("❌ Exception GET entreprises:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
