// api/auth/login.ts
// -------------------------------------------------------------
// Authentification par email + mot de passe
// -------------------------------------------------------------
//
// 📌 Description :
//   - Vérifie les credentials Supabase Auth
//   - Retourne un JWT d’accès + user enrichi
//   - Si rôle = "freelance" → joint les infos de l’entreprise
//
// 📍 Endpoint :
//   - POST /api/auth/login → { token, user }
//
// 🔒 Règles d’accès :
//   - Public (email + mot de passe requis)
//   - L’accès ultérieur se fait via le token retourné
//
// ⚠️ Remarques :
//   - Ne dépend plus de user_metadata (fallback sur table `profiles`)
//   - Compatible avec Google / Magic Link / email classique
//
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.js";

// ----------------------
// Supabase client public
// ----------------------
const supabase = createClient<Database>(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_ANON_KEY as string
);

// ----------------------
// Types locaux
// ----------------------
type EntrepriseRow = Database["public"]["Tables"]["entreprise"]["Row"];

interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
    slug: string | null;
    nom: string | null;
    prenom: string | null;
  };
}

// -------------------------------------------------------------
// Handler principal
// -------------------------------------------------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "❌ Méthode non autorisée" });
  }

  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return res.status(400).json({ error: "❌ Email et mot de passe requis" });
  }

  try {
    // 1️⃣ Authentification via Supabase
    const {
      data: { user, session },
      error,
    } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !user || !session) {
      return res
        .status(401)
        .json({ error: "❌ Email ou mot de passe incorrect" });
    }

    // 2️⃣ Récupère le profil depuis la table `profiles`
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, first_name, last_name")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.warn("⚠️ Erreur lecture profil:", profileError.message);
    }

    const role =
      profile?.role ??
      (user.user_metadata?.role as string | undefined) ??
      "client";

    // 3️⃣ Si freelance → récupérer les infos entreprise
    let entreprise: Pick<EntrepriseRow, "slug" | "nom" | "prenom"> | null =
      null;
    if (role === "freelance") {
      const { data: ent, error: entError } = await supabase
        .from("entreprise")
        .select("slug, nom, prenom")
        .eq("user_id", user.id)
        .maybeSingle();

      if (entError) {
        console.warn("⚠️ Erreur lecture entreprise:", entError.message);
      }

      entreprise = ent;
    }

    // 4️⃣ Structure finale du user
    const response: AuthResponse = {
      token: session.access_token,
      user: {
        id: user.id,
        email: user.email ?? "",
        role,
        slug: entreprise?.slug ?? null,
        nom: entreprise?.nom ?? null,
        prenom: entreprise?.prenom ?? null,
      },
    };

    console.log(`✅ Login réussi pour ${email} (role: ${role})`);
    return res.status(200).json(response);
  } catch (err: any) {
    console.error("💥 Exception /api/auth/login:", err);
    return res.status(500).json({ error: err.message || "Erreur serveur" });
  }
}
