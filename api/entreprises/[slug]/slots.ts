// api/entreprises/[slug]/slots.ts
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

  // 🔎 Récupérer l’entreprise
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
    // 📜 Lister slots → public
    case "GET": {
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

    // ➕ Créer slot → réservé owner
    case "POST": {
      const user = await checkAuth(req, entreprise.user_id, res);
      if (!user) return; // checkAuth a déjà répondu

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

    default:
      return res.status(405).json({ error: "Méthode non autorisée" });
  }
}

// ----------------------
// Helper auth
// ----------------------
async function checkAuth(
  req: VercelRequest,
  ownerId: string,
  res: VercelResponse
) {
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

  if (user.id !== ownerId) {
    res.status(403).json({ error: "❌ Forbidden (not your entreprise)" });
    return null;
  }

  return user;
}
