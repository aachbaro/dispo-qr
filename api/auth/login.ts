// api/auth/login.ts
// -------------------------------------------------------------
// Route : /api/auth/login
//
// - POST : Authentifie un utilisateur via email + password
//   • Vérifie les credentials dans Supabase Auth
//   • Retourne un JWT d’accès + infos de profil
//   • Si role = "freelance", joint les infos de l’entreprise associée
//
// ⚠️ Utilise la clé ANON (client standard)
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

// ----------------------
// Supabase client public
// ----------------------
const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_ANON_KEY as string // 🔑 Clé publique
);

// ----------------------
// Handler principal
// ----------------------
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

    // 2️⃣ Récupérer l’entreprise associée si role = freelance
    let entreprise = null;
    if (user.user_metadata?.role === "freelance") {
      const { data: ent, error: entError } = await supabase
        .from("entreprise")
        .select("id, slug, nom, prenom")
        .eq("user_id", user.id)
        .maybeSingle();

      if (entError) {
        console.warn(
          "⚠️ Impossible de charger l’entreprise liée:",
          entError.message
        );
      }

      entreprise = ent;
    }

    // 3️⃣ Retourner token + infos user
    return res.status(200).json({
      token: session.access_token, // 🎟️ JWT d’auth
      user: {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role ?? "client",
        slug: entreprise?.slug ?? null,
        nom: entreprise?.nom ?? null,
        prenom: entreprise?.prenom ?? null,
      },
    });
  } catch (err: any) {
    console.error("❌ Exception login:", err);
    return res.status(500).json({ error: err.message || "Erreur serveur" });
  }
}
