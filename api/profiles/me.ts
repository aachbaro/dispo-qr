// api/profiles/me.ts
// -------------------------------------------------------------
// Route profil utilisateur connecté : /api/profiles/me
//
// - GET : Récupère les infos du profil lié au user connecté
//   • Combine auth.users (email) et profiles (role, etc.)
//
// - PUT : Met à jour le profil du user connecté
//   • Exemple : mise à jour du rôle
//
// ⚠️ Auth obligatoire (JWT dans Authorization header)
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../_supabase.js";

// ----------------------
// Helpers
// ----------------------

/**
 * ✅ Vérifie le token et retourne le user
 */
async function getUserFromToken(req: VercelRequest) {
  const auth = req.headers.authorization;
  if (!auth) return null;

  const token = auth.split(" ")[1];
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return null;

  return data.user;
}

// ----------------------
// Handler principal
// ----------------------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // ✅ Auth obligatoire
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    if (req.method === "GET") {
      // 🔍 Récupère le profil lié
      const { data: profile, error } = await supabaseAdmin
        .from("profiles")
        .select("id, role, created_at")
        .eq("id", user.id)
        .single();

      if (error) return res.status(500).json({ error: error.message });

      return res.status(200).json({
        profile: {
          id: user.id,
          email: user.email,
          role: profile?.role,
          created_at: profile?.created_at,
        },
      });
    }

    if (req.method === "PUT") {
      const updates = req.body;

      const { data, error } = await supabaseAdmin
        .from("profiles")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });

      return res.status(200).json({ profile: data });
    }

    return res.status(405).json({ error: "Méthode non autorisée" });
  } catch (err: any) {
    console.error("❌ Exception profil me:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
