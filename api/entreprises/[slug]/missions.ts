// api/entreprises/[slug]/missions.ts
import { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ⚠️ Service key pour API côté serveur
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { slug } = req.query;

  if (!slug || typeof slug !== "string") {
    return res.status(400).json({ error: "Slug requis" });
  }

  // 1️⃣ Vérifier l’entreprise par slug
  const { data: entreprise, error: errEntreprise } = await supabase
    .from("entreprise")
    .select("id")
    .eq("slug", slug)
    .single();

  if (errEntreprise || !entreprise) {
    return res.status(404).json({ error: "Entreprise introuvable" });
  }

  const entrepriseId = entreprise.id;

  // 2️⃣ GET missions
  if (req.method === "GET") {
    const { from, to, status } = req.query;

    let query = supabase
      .from("missions")
      .select("*")
      .eq("entreprise_id", entrepriseId)
      .order("date_slot", { ascending: true });

    if (from && to) {
      query = query
        .gte("date_slot", from as string)
        .lt("end_slot", to as string);
    }
    if (status) {
      query = query.eq("status", status as string);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ missions: data });
  }

  // 3️⃣ POST mission
  if (req.method === "POST") {
    const {
      date_slot,
      end_slot,
      etablissement,
      etablissement_address,
      contact_name,
      contact_email,
      contact_phone,
      instructions,
      mode = "freelance",
      status = "proposé",
      client_id,
      freelance_id,
    } = req.body;

    if (
      !date_slot ||
      !end_slot ||
      !etablissement ||
      !contact_email ||
      !contact_phone
    ) {
      return res.status(400).json({ error: "Champs obligatoires manquants" });
    }

    const { data, error } = await supabase
      .from("missions")
      .insert([
        {
          date_slot,
          end_slot,
          etablissement,
          etablissement_address,
          contact_name,
          contact_email,
          contact_phone,
          instructions,
          mode,
          status,
          client_id,
          freelance_id,
          entreprise_id: entrepriseId,
        },
      ])
      .select("*")
      .single();

    if (error) return res.status(500).json({ error: error.message });

    return res.status(201).json({ mission: data });
  }

  return res.status(405).json({ error: "Méthode non autorisée" });
}
