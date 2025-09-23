// api/auth/me.ts
// -------------------------------------------------------------
// Route : /api/auth/me
//
// - GET : Retourne les infos d'auth du user connecté
//   • Données brutes de Supabase Auth (id, email, etc.)
//   • Utile pour vérifier rapidement si un user est connecté
//
// ⚠️ Auth obligatoire (JWT dans Authorization header)
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../_supabase.js";

// ----------------------
// Helpers
// ----------------------

/**
 * ✅ Vérifie le token et retourne le user depuis Supabase Auth
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
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Méthode non autorisée" });
    }

    // ✅ Auth obligatoire
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    return res.status(200).json({ user });
  } catch (err: any) {
    console.error("❌ Exception auth/me:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
