// api/auth/me.ts
// -------------------------------------------------------------
// Route : /api/auth/me
// -------------------------------------------------------------
//
// 📌 Description :
//   - GET : Retourne les infos d’auth du user connecté
//   - Données brutes de Supabase Auth (id, email, metadata…)
//   - Utile pour vérifier rapidement si un user est connecté
//
// 📍 Endpoints :
//   - GET /api/auth/me → retourne { user }
//
// 🔒 Règles d’accès :
//   - Auth obligatoire (JWT dans Authorization header)
//
// ⚠️ Remarques :
//   - Réutilise supabaseAdmin pour valider le token
//   - Retourne null si le token est invalide ou expiré
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../_supabase.js";
import { getUserFromToken } from "../utils/auth.js";

// ----------------------
// Handler principal
// ----------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "❌ Méthode non autorisée" });
  }

  try {
    // ✅ Vérifier auth
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: "❌ Non authentifié" });
    }

    return res.status(200).json({ user });
  } catch (err: any) {
    console.error("❌ Exception auth/me:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
