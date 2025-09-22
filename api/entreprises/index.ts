// api/entreprises/index.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../_supabase"; // service (insert/check)
import { createClient } from "@supabase/supabase-js";

// ⚠️ Client public pour vérifier le token
const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_ANON_KEY as string
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    try {
      const { data, error } = await supabaseAdmin
        .from("entreprise")
        .select(
          "id, nom, prenom, email, telephone, slug, siret, statut_juridique, taux_horaire, devise, created_at"
        )
        .order("created_at", { ascending: false });

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ entreprises: data ?? [] });
    } catch (err: any) {
      console.error("❌ GET entreprises:", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  if (req.method === "POST") {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "❌ Unauthorized (no token)" });
      }

      const token = authHeader.split(" ")[1];
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser(token);

      if (userError || !user) {
        return res
          .status(401)
          .json({ error: "❌ Unauthorized (invalid token)" });
      }

      const body = req.body;
      if (
        !body?.nom ||
        !body?.prenom ||
        !body?.email ||
        !body?.siret ||
        !body?.iban ||
        !body?.bic
      ) {
        return res
          .status(400)
          .json({ error: "❌ Champs obligatoires manquants" });
      }

      const { data, error } = await supabaseAdmin
        .from("entreprise")
        .insert([{ ...body, user_id: user.id }])
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });

      return res.status(201).json({ entreprise: data });
    } catch (err: any) {
      console.error("❌ POST entreprise:", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  return res.status(405).json({ error: "Méthode non autorisée" });
}
