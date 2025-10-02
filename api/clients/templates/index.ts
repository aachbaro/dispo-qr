// api/clients/templates/index.ts
// -------------------------------------------------------------
// Gestion des modèles de mission d’un client (via auth uniquement)
// -------------------------------------------------------------
//
// 📌 Description :
//   - GET  → Liste les templates du client connecté
//   - POST → Crée un nouveau template pour le client connecté
//
// 🔒 Règles d’accès :
//   - Seul le client authentifié peut gérer ses templates
//   - L’ID client est pris depuis le token (pas l’URL)
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../_supabase.js";
import { getUserFromToken } from "../../utils/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ error: "Non authentifié" });
  if (user.user_metadata?.role !== "client") {
    return res.status(403).json({ error: "Accès interdit" });
  }

  if (req.method === "GET") {
    // 📋 Liste des templates du client
    const { data, error } = await supabaseAdmin
      .from("mission_templates")
      .select("*")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ templates: data });
  }

  if (req.method === "POST") {
    const payload = req.body;
    if (!payload?.nom || !payload?.etablissement) {
      return res.status(400).json({ error: "Champs requis manquants" });
    }

    const { data, error } = await supabaseAdmin
      .from("mission_templates")
      .insert([{ ...payload, client_id: user.id }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ template: data });
  }

  return res.status(405).json({ error: "Méthode non autorisée" });
}
