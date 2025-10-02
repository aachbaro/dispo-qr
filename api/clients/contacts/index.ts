// api/clients/contacts/index.ts
// -------------------------------------------------------------
// Gestion des contacts client (extras favoris)
// -------------------------------------------------------------
//
// 📌 Description :
//   - GET  → Liste tous les extras favoris du client connecté
//   - POST → Ajoute un extra à sa liste (via entreprise_id)
//
// 🔒 Règles d’accès :
//   - Seul le client connecté peut gérer ses contacts
//   - client_id = user.id (Supabase Auth UUID)
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../_supabase.js";
import { requireAuth } from "../../utils/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireAuth(req, "client");
  if (!user) return res.status(401).json({ error: "Non authentifié" });

  const clientId = user.id;

  if (req.method === "GET") {
    // 📋 Liste des contacts avec infos entreprise
    const { data, error } = await supabaseAdmin
      .from("client_contacts")
      .select("id, created_at, entreprise:entreprise_id(*)")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ contacts: data });
  }

  if (req.method === "POST") {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { entreprise_id } = body || {};
    if (!entreprise_id)
      return res.status(400).json({ error: "entreprise_id requis" });

    // Vérifie si déjà existant
    const { data: existing } = await supabaseAdmin
      .from("client_contacts")
      .select("id")
      .eq("client_id", clientId)
      .eq("entreprise_id", entreprise_id)
      .maybeSingle();

    if (existing) {
      return res.status(200).json({ message: "✅ Déjà dans vos contacts" });
    }

    // Sinon, insère
    const { data, error } = await supabaseAdmin
      .from("client_contacts")
      .insert({
        client_id: clientId,
        entreprise_id,
      })
      .select("*, entreprise(*)")
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ contact: data });
  }

  return res.status(405).json({ error: "Méthode non autorisée" });
}
