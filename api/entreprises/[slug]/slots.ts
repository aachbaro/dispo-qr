// api/entreprises/[slug]/slots.ts
import { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ⚠️ SERVICE KEY car accès à toutes les lignes
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { slug } = req.query;

  if (!slug || typeof slug !== "string") {
    return res.status(400).json({ error: "Slug requis" });
  }

  // 1️⃣ Récupérer l’entreprise via slug
  const { data: entreprise, error: errEntreprise } = await supabase
    .from("entreprise")
    .select("id")
    .eq("slug", slug)
    .single();

  if (errEntreprise || !entreprise) {
    return res.status(404).json({ error: "Entreprise introuvable" });
  }

  const entrepriseId = entreprise.id;

  // 2️⃣ GET slots
  if (req.method === "GET") {
    const { from, to } = req.query;

    let query = supabase
      .from("slots")
      .select("*")
      .eq("entreprise_id", entrepriseId)
      .order("start", { ascending: true });

    if (from && to) {
      query = query.gte("start", from as string).lt("end", to as string);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ slots: data });
  }

  // 3️⃣ POST slot
  if (req.method === "POST") {
    const { start, end, title } = req.body;

    if (!start || !end) {
      return res.status(400).json({ error: "Champs start et end requis" });
    }

    const { data, error } = await supabase
      .from("slots")
      .insert([{ start, end, title, entreprise_id: entrepriseId }])
      .select("*")
      .single();

    if (error) return res.status(500).json({ error: error.message });

    return res.status(201).json({ slot: data });
  }

  return res.status(405).json({ error: "Méthode non autorisée" });
}
