// api/entreprises/[id]/slots.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../_supabase.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res
      .status(400)
      .json({ error: "ID entreprise manquant ou invalide" });
  }

  // 📜 Liste publique des slots de l’entreprise
  if (req.method === "GET") {
    try {
      const { data, error } = await supabaseAdmin
        .from("slots")
        .select("id, start, end, title, created_at")
        .eq("entreprise_id", id)
        .order("start", { ascending: true });

      if (error) {
        console.error("❌ Erreur fetch slots:", error.message);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ slots: data });
    } catch (err: any) {
      console.error("❌ Exception GET slots:", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  // ➕ Créer un nouveau slot (owner uniquement)
  if (req.method === "POST") {
    try {
      const payload = req.body;

      if (!payload?.start || !payload?.end) {
        return res.status(400).json({ error: "Champs start et end requis" });
      }

      const { data, error } = await supabaseAdmin
        .from("slots")
        .insert([
          {
            entreprise_id: id,
            start: payload.start,
            end: payload.end,
            title: payload.title ?? null,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("❌ Erreur insert slot:", error.message);
        return res.status(500).json({ error: error.message });
      }

      return res.status(201).json({ slot: data });
    } catch (err: any) {
      console.error("❌ Exception POST slot:", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
  }

  return res.status(405).json({ error: "Méthode non autorisée" });
}
