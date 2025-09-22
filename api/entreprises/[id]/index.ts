// api/entreprises/[id]/index.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../_supabase.js";
import { createClient } from "@supabase/supabase-js";

// ⚠️ Client public (ANON) → pour vérifier le token envoyé dans Authorization
const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_ANON_KEY as string
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: "ID manquant ou invalide" });
  }

  // Récupération du token
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  // ✅ GET (lecture privée : besoin d’être connecté, mais pas forcément propriétaire)
  if (req.method === "GET") {
    try {
      const { data, error } = await supabaseAdmin
        .from("entreprise")
        .select("*")
        .eq("id", id)
        .single();

      if (error) return res.status(500).json({ error: error.message });
      if (!data)
        return res.status(404).json({ error: "Entreprise non trouvée" });

      return res.status(200).json({ data });
    } catch (err: any) {
      console.error("❌ Exception GET entreprise:", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  // ✅ PUT (update → seulement owner)
  if (req.method === "PUT") {
    if (!token)
      return res.status(401).json({ error: "❌ Unauthorized (no token)" });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ error: "❌ Unauthorized (invalid token)" });
    }

    try {
      // Vérifier que l’entreprise appartient bien à l’utilisateur
      const { data: entreprise } = await supabaseAdmin
        .from("entreprise")
        .select("user_id")
        .eq("id", id)
        .single();

      if (!entreprise || entreprise.user_id !== user.id) {
        return res.status(403).json({ error: "❌ Forbidden (not owner)" });
      }

      const updates = req.body;
      const { data, error } = await supabaseAdmin
        .from("entreprise")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ data });
    } catch (err: any) {
      console.error("❌ Exception PUT entreprise:", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  // ✅ DELETE (seulement owner)
  if (req.method === "DELETE") {
    if (!token)
      return res.status(401).json({ error: "❌ Unauthorized (no token)" });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ error: "❌ Unauthorized (invalid token)" });
    }

    try {
      const { data: entreprise } = await supabaseAdmin
        .from("entreprise")
        .select("user_id")
        .eq("id", id)
        .single();

      if (!entreprise || entreprise.user_id !== user.id) {
        return res.status(403).json({ error: "❌ Forbidden (not owner)" });
      }

      const { error } = await supabaseAdmin
        .from("entreprise")
        .delete()
        .eq("id", id);

      if (error) return res.status(500).json({ error: error.message });
      return res.status(204).end();
    } catch (err: any) {
      console.error("❌ Exception DELETE entreprise:", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  return res.status(405).json({ error: "Méthode non autorisée" });
}
