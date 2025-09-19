// api/auth/login.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return res.status(400).json({ error: "Email et mot de passe requis" });
  }

  try {
    // 🔎 Chercher l’utilisateur
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, password_hash, role")
      .eq("email", email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: "Utilisateur introuvable" });
    }

    // 🔑 Vérifier le mot de passe
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Mot de passe incorrect" });
    }

    // 📌 Si l’utilisateur est un freelance → récupérer l’entreprise associée
    let entreprise = null;
    if (user.role === "freelance") {
      const { data: ent, error: entError } = await supabase
        .from("entreprise")
        .select("id, slug, nom, prenom")
        .eq("user_id", user.id)
        .maybeSingle();

      if (entError) {
        console.error("Erreur récupération entreprise:", entError);
      } else {
        entreprise = ent;
      }
    }

    // 🎟 Générer un JWT (valable 1h)
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        slug: entreprise?.slug ?? null, // 👈 dispo dans ton header
        nom: entreprise?.nom ?? null,
        prenom: entreprise?.prenom ?? null,
      },
    });
  } catch (err: any) {
    console.error("Erreur login:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
