// api/entreprises/[slug].ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { slug } = req.query;

  if (!slug || typeof slug !== "string") {
    return res.status(400).json({ error: "Slug manquant ou invalide" });
  }

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("entreprise")
      .select(
        "id, user_id, nom, prenom, adresse, email, telephone, siret, statut_juridique, slug, created_at"
      )
      .eq("slug", slug)
      .single();

    if (error) return res.status(404).json({ error: error.message });
    return res.status(200).json({ data });
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}
