// api/clients/templates/index.ts
// -------------------------------------------------------------
// Gestion des modèles de mission d’un client (authentifié)
// -------------------------------------------------------------
//
// 📌 Description :
//   - GET  → Liste les modèles (templates) du client connecté
//   - POST → Crée un nouveau modèle pour le client connecté
//
// 📍 Endpoints :
//   - GET  /api/clients/templates   → liste des modèles
//   - POST /api/clients/templates   → création d’un modèle
//
// 🔒 Règles d’accès :
//   - Authentification obligatoire (JWT Supabase)
//   - Rôle requis : "client"
//   - L’ID du client est dérivé du token (user.id)
//
// ⚠️ Remarques :
//   - Les templates sont liés à la table `mission_templates`
//   - Le champ `client_id` est automatiquement défini depuis le JWT
//
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../_supabase.js";
import { getUserFromToken } from "../../utils/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // 🔑 Authentification via token
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: "❌ Non authentifié" });
    }

    // 🧩 Vérification du rôle
    if (user.role !== "client") {
      return res.status(403).json({ error: "❌ Accès réservé aux clients" });
    }

    // ----------------------------
    // 📋 GET → Liste des templates
    // ----------------------------
    if (req.method === "GET") {
      const { data, error } = await supabaseAdmin
        .from("mission_templates")
        .select("*")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Erreur chargement templates:", error.message);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ templates: data ?? [] });
    }

    // ----------------------------
    // ➕ POST → Création d’un template
    // ----------------------------
    if (req.method === "POST") {
      const payload = req.body;

      if (!payload?.nom || !payload?.etablissement) {
        return res
          .status(400)
          .json({ error: "❌ Champs requis manquants : nom, etablissement" });
      }

      const { data, error } = await supabaseAdmin
        .from("mission_templates")
        .insert([{ ...payload, client_id: user.id }])
        .select()
        .single();

      if (error) {
        console.error("❌ Erreur création template:", error.message);
        return res.status(500).json({ error: error.message });
      }

      return res.status(201).json({ template: data });
    }

    // ----------------------------
    // ❌ Méthode non autorisée
    // ----------------------------
    return res.status(405).json({ error: "❌ Méthode non autorisée" });
  } catch (err: any) {
    console.error("💥 Exception /api/clients/templates :", err);
    return res
      .status(500)
      .json({ error: err.message || "Erreur interne du serveur" });
  }
}
