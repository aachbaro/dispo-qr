// api/auth/login.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

// ----------------------
// Supabase client
// ----------------------
const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_ANON_KEY as string // ⚠️ ANON KEY car c’est l’auth standard
);

// ----------------------
// Handler
// ----------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "❌ Method not allowed" });
  }

  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return res.status(400).json({ error: "❌ Email et mot de passe requis" });
  }

  try {
    // 🔑 Auth via Supabase
    const {
      data: { user, session },
      error,
    } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !user || !session) {
      return res
        .status(401)
        .json({ error: "❌ Email ou mot de passe incorrect" });
    }

    // 📌 Récupérer l’entreprise associée (si c’est un freelance)
    let entreprise = null;
    if (user.user_metadata?.role === "freelance") {
      const { data: ent } = await supabase
        .from("entreprise")
        .select("id, slug, nom, prenom")
        .eq("user_id", user.id)
        .maybeSingle();

      entreprise = ent;
    }

    return res.status(200).json({
      token: session.access_token, // 🎟️ token JWT géré par Supabase
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
    console.error("❌ Erreur login:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
