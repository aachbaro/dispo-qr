// api/utils/auth.ts
// -------------------------------------------------------------
// Helpers d’authentification (Supabase JWT)
// -------------------------------------------------------------
//
// 📌 Fonctions :
//   - getUserFromToken(req)   → retourne le user depuis Authorization header
//   - requireAuth(req, role?) → vérifie que le user est bien connecté
//
// 🔒 Règles d’accès :
//   - Vérifie le JWT avec supabaseAdmin.auth.getUser(token)
//   - Optionnellement contrôle le rôle (freelance, client, admin…)
// -------------------------------------------------------------

import type { VercelRequest } from "@vercel/node";
import { supabaseAdmin } from "../_supabase.js";

export async function getUserFromToken(req: VercelRequest) {
  const auth = req.headers.authorization;
  if (!auth) return null;

  const token = auth.split(" ")[1];
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error) {
    console.error("❌ Erreur getUserFromToken:", error.message);
    return null;
  }

  return data.user || null;
}

/**
 * 🚨 Vérifie qu’un user est connecté et éventuellement son rôle
 */
export async function requireAuth(req: VercelRequest, role?: string) {
  const user = await getUserFromToken(req);
  if (!user) return null;

  if (role && user.user_metadata?.role !== role) {
    return null;
  }
  return user;
}
