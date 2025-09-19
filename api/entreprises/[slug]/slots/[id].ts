// api/entreprises/[slug]/slots/[id].ts
import { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

// ⚠️ On utilise la SERVICE_ROLE_KEY côté API serverless (jamais côté frontend)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { slug, id } = req.query;

  // Validation basique des paramètres
  if (!slug || typeof slug !== "string") {
    return res.status(400).json({ error: "Slug requis" });
  }
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: "ID invalide" });
  }

  // 1️⃣ Vérifier que l’entreprise existe
  const { data: entreprise, error: errEntreprise } = await supabase
    .from("entreprise")
    .select("id")
    .eq("slug", slug)
    .single();

  if (errEntreprise || !entreprise) {
    return res.status(404).json({ error: "Entreprise introuvable" });
  }

  const entrepriseId = entreprise.id;

  // 2️⃣ Switch sur la méthode HTTP
  switch (req.method) {
    case "GET": {
      // 🔹 Récupérer un slot spécifique
      const { data, error } = await supabase
        .from("slots")
        .select("*")
        .eq("id", Number(id))
        .eq("entreprise_id", entrepriseId)
        .single();

      if (error || !data) {
        return res.status(404).json({ error: "Slot introuvable" });
      }
      return res.status(200).json({ slot: data });
    }

    case "PUT": {
      // 🔹 Mettre à jour un slot
      const { start, end, title } = req.body;
      if (!start || !end) {
        return res.status(400).json({ error: "Champs start et end requis" });
      }

      const { data, error } = await supabase
        .from("slots")
        .update({ start, end, title })
        .eq("id", Number(id))
        .eq("entreprise_id", entrepriseId)
        .select("*")
        .single();

      if (error || !data) {
        return res
          .status(500)
          .json({ error: error?.message || "Erreur update slot" });
      }
      return res.status(200).json({ slot: data });
    }

    case "DELETE": {
      // 🔹 Supprimer un slot
      const { error } = await supabase
        .from("slots")
        .delete()
        .eq("id", Number(id))
        .eq("entreprise_id", entrepriseId);

      if (error) {
        return res.status(500).json({ error: error.message });
      }
      return res.status(204).end();
    }

    default:
      return res.status(405).json({ error: "Méthode non autorisée" });
  }
}
