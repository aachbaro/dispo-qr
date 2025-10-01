// api/auth/logout.ts
// -------------------------------------------------------------
// Route : /api/auth/logout
// -------------------------------------------------------------
//
// 📌 Description :
//   - POST : Déconnexion d’un utilisateur
//   - Invalide la session côté serveur (signOut Supabase Admin)
//   - Côté client : le token doit être supprimé du localStorage
//
// 📍 Endpoints :
//   - POST /api/auth/logout → supprime la session côté serveur
//
// 🔒 Règles d’accès :
//   - Auth obligatoire (JWT dans Authorization header)
//
// ⚠️ Remarques :
//   - L’appel à signOut() est optionnel (utile si on veut révoquer les refresh tokens)
//   - La suppression locale (localStorage) doit être gérée côté frontend
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node"
import { supabaseAdmin } from "../_supabase.js"

// ----------------------
// Handler principal
// ----------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "❌ Méthode non autorisée" })
  }

  try {
    // ✅ Récupérer le token du header Authorization
    const auth = req.headers.authorization
    const token = auth?.split(" ")[1]

    if (!token) {
      return res.status(401).json({ error: "❌ Non authentifié" })
    }

    // 🔒 Optionnel : invalider les refresh tokens (logout global)
    const { error } = await supabaseAdmin.auth.admin.signOut(token)
    if (error) {
      console.warn("⚠️ Erreur signOut (non bloquant):", error.message)
    }

    return res.status(200).json({ message: "✅ Déconnecté avec succès" })
  } catch (err: any) {
    console.error("❌ Exception logout:", err)
    return res.status(500).json({ error: "Erreur serveur" })
  }
}
