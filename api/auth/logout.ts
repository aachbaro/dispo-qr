// api/auth/logout.ts
// -------------------------------------------------------------
// Route : /api/auth/logout
//
// - POST : Déconnexion du user
//   • Invalide la session côté client en supprimant le token local
//   • (Optionnel) appelle signOut() si tu veux vraiment gérer les refresh tokens
//
// ⚠️ Auth obligatoire (JWT dans Authorization header)
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../_supabase.js";

// ----------------------
// Handler principal
// ----------------------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Méthode non autorisée" });
    }

    // ✅ Récupérer le token
    const auth = req.headers.authorization;
    const token = auth?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    // ⚠️ Optionnel : révoquer les refresh tokens (Supabase v2)
    // Ici, ça sert surtout si tu veux vraiment forcer le logout global
    const { error } = await supabaseAdmin.auth.admin.signOut(token);
    if (error) {
      console.warn("⚠️ Erreur signOut (non bloquant):", error.message);
    }

    // ✅ Côté client, il faut supprimer le token du localStorage
    return res.status(200).json({ message: "Déconnecté avec succès" });
  } catch (err: any) {
    console.error("❌ Exception auth/logout:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
