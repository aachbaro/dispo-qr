// api/entreprises.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

// ----------------------
// Supabase client (SERVICE_KEY côté API)
// ----------------------
const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

// ----------------------
// Handler principal
// ----------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    switch (req.method) {
      case "GET":
        return await handleGet(res);

      case "POST":
        return await handlePost(req, res);

      default:
        return res.status(405).json({ error: "❌ Method not allowed" });
    }
  } catch (err: any) {
    console.error("❌ Unexpected error:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}

// ----------------------
// GET: liste publique des entreprises
// ----------------------
async function handleGet(res: VercelResponse) {
  const { data, error } = await supabase
    .from("entreprise")
    .select(
      "id, nom, prenom, adresse, email, telephone, slug, siret, statut_juridique, " +
        "tva_intracom, mention_tva, iban, bic, taux_horaire, devise, " +
        "conditions_paiement, penalites_retard, created_at, updated_at"
    )
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ entreprises: data ?? [] });
}

// ----------------------
// POST: créer une entreprise (auth requise)
// ----------------------
async function handlePost(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "❌ Unauthorized (no token)" });
  }

  const token = authHeader.split(" ")[1];

  // ✅ Vérifie le user via Supabase Auth
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return res.status(401).json({ error: "❌ Unauthorized (invalid token)" });
  }

  // Champs attendus
  const {
    nom,
    prenom,
    adresse,
    email,
    telephone,
    siret,
    statut_juridique,
    tva_intracom,
    mention_tva,
    iban,
    bic,
    taux_horaire,
    devise,
    conditions_paiement,
    penalites_retard,
    slug,
  } = req.body;

  if (!nom || !prenom || !adresse || !email || !siret || !iban || !bic) {
    return res.status(400).json({ error: "❌ Champs obligatoires manquants" });
  }

  // ➕ Insert entreprise liée au user_id
  const { data, error } = await supabase
    .from("entreprise")
    .insert([
      {
        user_id: user.id, // 🔑 lié au user Supabase Auth
        nom,
        prenom,
        adresse,
        email,
        telephone,
        siret,
        statut_juridique,
        tva_intracom,
        mention_tva,
        iban,
        bic,
        taux_horaire,
        devise,
        conditions_paiement,
        penalites_retard,
        slug,
      },
    ])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json({ entreprise: data });
}
