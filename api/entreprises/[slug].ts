// api/entreprises/[slug].ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

// ----------------------
// Supabase client (SERVICE_KEY car API sécurisée côté serveur)
// ----------------------
const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

// ----------------------
// Champs à exposer publiquement
// ----------------------
const ENTREPRISE_FIELDS = `
  id, user_id, nom, prenom, adresse, email, telephone, siret,
  statut_juridique, tva_intracom, mention_tva, iban, bic,
  taux_horaire, devise, conditions_paiement, penalites_retard,
  slug, created_at, updated_at
`;

// ----------------------
// Handler principal
// ----------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { slug } = req.query;

  if (!slug || typeof slug !== "string") {
    return res.status(400).json({ error: "❌ Slug manquant ou invalide" });
  }

  try {
    switch (req.method) {
      case "GET":
        return await handleGet(slug, res);

      case "PUT":
        return await handlePut(slug, req, res);

      default:
        return res.status(405).json({ error: "❌ Method Not Allowed" });
    }
  } catch (err: any) {
    console.error("❌ Unexpected error:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}

// ----------------------
// GET: récupérer une entreprise (public)
// ----------------------
async function handleGet(slug: string, res: VercelResponse) {
  const { data, error } = await supabase
    .from("entreprise")
    .select(ENTREPRISE_FIELDS)
    .eq("slug", slug)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: "Entreprise introuvable" });
  }

  return res.status(200).json({ data });
}

// ----------------------
// PUT: mettre à jour une entreprise (owner uniquement)
// ----------------------
async function handlePut(
  slug: string,
  req: VercelRequest,
  res: VercelResponse
) {
  // Vérifie la présence du token
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

  // Vérifie que l’entreprise appartient bien à ce user
  const { data: entreprise, error: fetchError } = await supabase
    .from("entreprise")
    .select("id, user_id")
    .eq("slug", slug)
    .single();

  if (fetchError || !entreprise) {
    return res.status(404).json({ error: "Entreprise introuvable" });
  }

  if (entreprise.user_id !== user.id) {
    return res
      .status(403)
      .json({ error: "❌ Forbidden (not your entreprise)" });
  }

  // Applique la mise à jour
  const updates = req.body;
  const { data, error: updateError } = await supabase
    .from("entreprise")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("slug", slug)
    .select(ENTREPRISE_FIELDS)
    .single();

  if (updateError) {
    return res.status(400).json({ error: updateError.message });
  }

  return res.status(200).json({ data });
}
