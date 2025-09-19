// api/auth/register.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

// 🔧 Génère un slug "prenom-nom", avec suffixe si déjà pris
async function generateUniqueSlug(nom: string, prenom: string) {
  const base = `${prenom}-${nom}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  let slug = base;
  let i = 1;

  while (true) {
    const { data } = await supabase
      .from("entreprise")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (!data) break; // dispo
    slug = `${base}-${i++}`;
  }

  return slug;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { email, password, role, entreprise } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!["freelance", "client"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  try {
    // 🔒 Hash du mot de passe
    const passwordHash = await bcrypt.hash(password, 10);

    // ➕ Création du user
    const { data: user, error: userError } = await supabase
      .from("users")
      .insert([{ email, password_hash: passwordHash, role }])
      .select()
      .single();

    if (userError) {
      return res.status(500).json({ error: userError.message });
    }

    let createdEntreprise = null;

    // ➕ Si freelance → créer son entreprise liée
    if (role === "freelance") {
      if (!entreprise?.nom || !entreprise?.prenom) {
        return res
          .status(400)
          .json({ error: "Nom et prénom obligatoires pour un freelance" });
      }

      const slug = await generateUniqueSlug(entreprise.nom, entreprise.prenom);

      const { data: ent, error: entError } = await supabase
        .from("entreprise")
        .insert([
          {
            user_id: user.id,
            nom: entreprise.nom,
            prenom: entreprise.prenom,
            slug,
            adresse: entreprise.adresse ?? "",
            email,
            telephone: entreprise.telephone ?? null,
            siret: entreprise.siret ?? "",
            statut_juridique: entreprise.statut_juridique ?? "micro-entreprise",
            tva_intracom: entreprise.tva_intracom ?? null,
            mention_tva:
              entreprise.mention_tva ?? "TVA non applicable, art. 293 B du CGI",
            iban: entreprise.iban ?? "",
            bic: entreprise.bic ?? "",
            taux_horaire: entreprise.taux_horaire ?? 20.0,
            devise: entreprise.devise ?? "EUR",
            conditions_paiement:
              entreprise.conditions_paiement ?? "Paiement comptant à réception",
            penalites_retard:
              entreprise.penalites_retard ??
              "Taux BCE + 10 pts, indemnité forfaitaire 40 €",
          },
        ])
        .select()
        .single();

      if (entError) {
        return res.status(500).json({ error: entError.message });
      }

      createdEntreprise = ent;
    }

    // 🔑 Générer un JWT pour l’utilisateur
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      user: { id: user.id, email: user.email, role: user.role },
      entreprise: createdEntreprise,
      token,
    });
  } catch (err: any) {
    console.error("Erreur register:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
