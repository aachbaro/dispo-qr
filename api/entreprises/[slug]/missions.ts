// api/entreprises/[slug]/missions.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { slug } = req.query;
  if (!slug || typeof slug !== "string") {
    return res.status(400).json({ error: "Slug requis" });
  }

  // Vérifier entreprise
  const { data: entreprise, error: errEntreprise } = await supabase
    .from("entreprise")
    .select("id, user_id")
    .eq("slug", slug)
    .single();

  if (errEntreprise || !entreprise) {
    return res.status(404).json({ error: "Entreprise introuvable" });
  }

  const entrepriseId = entreprise.id;

  switch (req.method) {
    // 📜 Lister missions → public
    case "GET": {
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

    // ➕ Créer une mission → client loggé
    case "POST": {
      const user = await checkAuth(req, res);
      if (!user) return;

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
            status: "proposé",
            client_id: user.id,
            entreprise_id: entrepriseId,
          },
        ])
        .select("*")
        .single();

      if (error) return res.status(500).json({ error: error.message });

      return res.status(201).json({ mission: data });
    }

    default:
      return res.status(405).json({ error: "Méthode non autorisée" });
  }
}

// ----------------------
// Helper auth (client doit être loggé)
// ----------------------
async function checkAuth(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "❌ Unauthorized (no token)" });
    return null;
  }

  const token = authHeader.split(" ")[1];
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    res.status(401).json({ error: "❌ Unauthorized (invalid token)" });
    return null;
  }

  return user;
}
