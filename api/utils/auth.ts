// api/utils/auth.ts
// -------------------------------------------------------------
// Helpers d’authentification (Supabase JWT enrichi)
// -------------------------------------------------------------
//
// 📌 Fonctions :
//   - getUserFromToken(req)   → retourne un AuthUser enrichi depuis la DB
//   - requireAuth(req, role?) → vérifie le rôle utilisateur (optionnel)
//
// ⚙️ Logique :
//   - Décodage du JWT Supabase pour extraire l'id utilisateur
//   - Chargement complet depuis les tables `profiles` et `entreprise`
//   - Ne dépend plus des user_metadata (source = base de données)
//
// -------------------------------------------------------------

import type { VercelRequest } from "@vercel/node";
import jwt from "jsonwebtoken";
import { supabaseAdmin } from "../_supabase.js";
import type { Tables } from "../../types/database.js";

// ----------------------
// Types
// ----------------------
type ProfileRow = Tables<"profiles">;
type EntrepriseRow = Tables<"entreprise">;

export interface AuthUser {
  id: string;
  email: string | null;
  role: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  slug?: string | null; // slug entreprise si freelance
}

// -------------------------------------------------------------
// getUserFromToken()
// -------------------------------------------------------------
export async function getUserFromToken(
  req: VercelRequest
): Promise<AuthUser | null> {
  const auth = req.headers.authorization;
  console.log("🔑 Header reçu:", auth);

  if (!auth) return null;
  const token = auth.split(" ")[1];
  if (!token) return null;

  try {
    // ✅ Décodage local du JWT (signé par Supabase)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.sub;
    const email = decoded.email ?? null;

    console.log("🧩 Token décodé:", {
      sub: decoded.sub,
      email: decoded.email,
      exp: decoded.exp,
    });

    // 🧱 Lecture du profil complet depuis la base
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role, first_name, last_name, phone")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.warn("⚠️ Erreur lecture profil:", profileError.message);
    }

    // 🏢 Si FREELANCE → récupérer le slug entreprise
    let slug: string | null = null;
    if (profile?.role === "freelance") {
      const { data: entreprise, error: entError } = await supabaseAdmin
        .from("entreprise")
        .select("slug")
        .eq("user_id", userId)
        .maybeSingle();

      if (entError) {
        console.warn("⚠️ Erreur fetch entreprise (slug):", entError.message);
      }

      slug = entreprise?.slug ?? null;
    }

    // ✅ Structure finale
    const user: AuthUser = {
      id: userId,
      email,
      role: profile?.role ?? null,
      first_name: profile?.first_name ?? null,
      last_name: profile?.last_name ?? null,
      phone: profile?.phone ?? null,
      slug,
    };

    console.log("✅ AuthUser final:", user);
    return user;
  } catch (err) {
    console.error("❌ Token Supabase invalide ou expiré:", err);
    return null;
  }
}

// -------------------------------------------------------------
// requireAuth()
// -------------------------------------------------------------
export async function requireAuth(
  req: VercelRequest,
  role?: string
): Promise<AuthUser | null> {
  const user = await getUserFromToken(req);
  if (!user) {
    console.warn("🚫 Requête refusée : utilisateur non authentifié.");
    return null;
  }

  if (role && user.role !== role) {
    console.warn(
      `🚫 Accès refusé : rôle requis (${role}), trouvé : ${user.role}`
    );
    return null;
  }

  return user;
}
