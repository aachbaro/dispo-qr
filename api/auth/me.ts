// api/auth/me.ts
// -------------------------------------------------------------
// Route : /api/auth/me
// -------------------------------------------------------------
//
// 📌 Description :
//   - GET : Retourne les infos d’auth du user connecté
//   - Combine les métadonnées Supabase Auth et la table `profiles`
//   - Utile pour vérifier si un user est connecté et charger ses rôles
//
// 📍 Endpoint :
//   - GET /api/auth/me → { user }
//
// 🔒 Règles d’accès :
//   - Auth obligatoire (JWT dans Authorization header)
//
// ⚙️ Améliorations :
//   - Si le rôle ou les champs essentiels manquent dans les métadonnées,
//     le handler va chercher les infos dans `public.profiles`.
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../_supabase.js";
import { getUserFromToken } from "../utils/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "❌ Méthode non autorisée" });
  }

  try {
    // ✅ Vérifie l'utilisateur via le token JWT
    const authUser = await getUserFromToken(req);
    if (!authUser) {
      return res.status(401).json({ error: "❌ Non authentifié" });
    }

    let user = { ...authUser };

    // 🔍 Si rôle ou infos de base manquants → récupérer depuis la table `profiles`
    if (!user.role || !user.first_name || !user.last_name) {
      const { data: profile, error } = await supabaseAdmin
        .from("profiles")
        .select("role, first_name, last_name, phone")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.warn("⚠️ Impossible de charger le profil :", error.message);
      }

      if (profile) {
        user = {
          ...user,
          role: profile.role ?? user.role,
          first_name: profile.first_name ?? user.first_name,
          last_name: profile.last_name ?? user.last_name,
          phone: profile.phone ?? user.phone,
        };
      }
    }

    // 🏢 Si c’est un freelance → récupérer le slug de son entreprise
    if (user.role === "freelance" && !user.slug) {
      const { data: entreprise, error: entError } = await supabaseAdmin
        .from("entreprise")
        .select("slug")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!entError && entreprise?.slug) {
        user.slug = entreprise.slug;
      }
    }

    // ✅ Réponse finale cohérente
    return res.status(200).json({ user });
  } catch (err: any) {
    console.error("❌ Exception auth/me:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
