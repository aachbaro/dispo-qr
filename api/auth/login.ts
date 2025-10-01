// api/auth/login.ts
// -------------------------------------------------------------
// Route : /api/auth/login
// -------------------------------------------------------------
//
// 📌 Description :
//   - POST : Authentifie un utilisateur via email + password
//   - Vérifie les credentials dans Supabase Auth
//   - Retourne un JWT d’accès + infos de profil
//   - Si role = "freelance", joint les infos de l’entreprise associée
//
// 📍 Endpoints :
//   - POST /api/auth/login → { token, user }
//     • user inclut id, email, role et éventuellement infos entreprise
//
// 🔒 Règles d’accès :
//   - Public (email + password requis)
//   - L’accès ultérieur se fait via le token retourné
//
// ⚠️ Remarques :
//   - Utilise la clé ANON (client public)
//   - Typage renforcé avec types/database.ts
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database";

// ----------------------
// Supabase client public
// ----------------------
const supabase = createClient<Database>(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_ANON_KEY as string // 🔑 Clé publique
);

// ----------------------
// Types locaux
// ----------------------
type EntrepriseRow = Database["public"]["Tables"]["entreprise"]["Row"];

interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string | undefined;
    role: string;
    slug: string | null;
    nom: string | null;
    prenom: string | null;
  };
}

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
    // 1️⃣ Authentification via Supabase Auth
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
    let entreprise: Pick<
      EntrepriseRow,
      "id" | "slug" | "nom" | "prenom"
    > | null = null;

    if (user.user_metadata?.role === "freelance") {
      const { data: ent, error: entError } = await supabase
        .from("entreprise")
        .select("id, slug, nom, prenom")
        .eq("user_id", user.id)
        .maybeSingle<Pick<EntrepriseRow, "id" | "slug" | "nom" | "prenom">>();

      if (entError) {
        console.warn(
          "⚠️ Impossible de charger l’entreprise liée:",
          entError.message
        );
      }

      entreprise = ent;
    }

    // 3️⃣ Réponse finale
    const response: AuthResponse = {
      token: session.access_token,
      user: {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role ?? "client",
        slug: entreprise?.slug ?? null,
        nom: entreprise?.nom ?? null,
        prenom: entreprise?.prenom ?? null,
      },
    };

    return res.status(200).json(response);
  } catch (err: any) {
    console.error("❌ Exception login:", err);
    return res.status(500).json({ error: err.message || "Erreur serveur" });
  }
}
