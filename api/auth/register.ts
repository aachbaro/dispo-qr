// api/auth/register.ts
// -------------------------------------------------------------
// Création d’un nouvel utilisateur
// -------------------------------------------------------------
//
// 📌 Description :
//   - Crée un utilisateur Supabase Auth
//   - Initialise son profil dans la table `profiles`
//   - Si role = "freelance" → crée aussi une entreprise liée
//   - Génère un slug unique pour l’entreprise
//
// 📍 Endpoint :
//   - POST /api/auth/register
//
// 🔒 Règles d’accès :
//   - Public (clé SERVICE côté backend)
//   - Validation stricte des champs requis
//
// ⚠️ Remarques :
//   - Compatible avec le modèle AuthUser enrichi
//   - Ne dépend plus de user_metadata (profil toujours dans `profiles`)
//   - Garantit cohérence entre Auth, profiles, entreprise
//
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../_supabase.js";
import type { TablesInsert } from "../../types/database.js";

// ----------------------
// Helper : génération slug unique
// ----------------------
async function generateUniqueSlug(
  nom: string,
  prenom: string
): Promise<string> {
  const base = `${prenom}-${nom}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  let slug = base;
  let i = 1;

  while (true) {
    const { data, error } = await supabaseAdmin
      .from("entreprise")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      console.error("❌ Erreur vérification slug:", error.message);
      throw new Error("Impossible de vérifier l’unicité du slug");
    }

    if (!data) break;
    slug = `${base}-${i++}`;
  }

  return slug;
}

// ----------------------
// Handler principal
// ----------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "❌ Méthode non autorisée" });
  }

  const { email, password, role, entreprise } = req.body;

  // ✅ Validation des champs
  if (!email || !password || !role) {
    return res.status(400).json({ error: "❌ Champs obligatoires manquants" });
  }
  if (!["freelance", "client"].includes(role)) {
    return res.status(400).json({ error: "❌ Rôle invalide" });
  }

  try {
    // 1️⃣ Création de l’utilisateur Supabase Auth
    const {
      data: { user },
      error: signUpError,
    } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (signUpError || !user) {
      console.error("❌ Erreur création user:", signUpError);
      return res.status(500).json({
        error: signUpError?.message || "Erreur création utilisateur",
      });
    }

    let createdEntreprise = null;

    // 2️⃣ Création du profil utilisateur
    const profileData: TablesInsert<"profiles"> = {
      id: user.id,
      email,
      role,
      first_name: entreprise?.prenom ?? null,
      last_name: entreprise?.nom ?? null,
    };

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert([profileData]);

    if (profileError) {
      console.error("❌ Erreur création profil:", profileError.message);
      return res.status(500).json({ error: "Erreur création profil" });
    }

    // 3️⃣ Si freelance → créer l’entreprise correspondante
    if (role === "freelance") {
      if (!entreprise?.nom || !entreprise?.prenom) {
        return res.status(400).json({ error: "Nom et prénom requis" });
      }

      const slug = await generateUniqueSlug(entreprise.nom, entreprise.prenom);

      const entrepriseData: TablesInsert<"entreprise"> = {
        user_id: user.id,
        nom: entreprise.nom,
        prenom: entreprise.prenom,
        slug,
        adresse_ligne1: entreprise.adresse_ligne1 ?? "",
        adresse_ligne2: entreprise.adresse_ligne2 ?? null,
        ville: entreprise.ville ?? null,
        code_postal: entreprise.code_postal ?? null,
        pays: entreprise.pays ?? null,
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
      };

      const { data: ent, error: entError } = await supabaseAdmin
        .from("entreprise")
        .insert([entrepriseData])
        .select()
        .single();

      if (entError) {
        console.error("❌ Erreur création entreprise:", entError.message);
        return res.status(500).json({ error: entError.message });
      }

      createdEntreprise = ent;

      // 4️⃣ Synchronisation du profil avec le slug
      const { error: updateProfileError } = await supabaseAdmin
        .from("profiles")
        .update({ slug: ent.slug })
        .eq("id", user.id);

      if (updateProfileError) {
        console.warn(
          "⚠️ Erreur mise à jour slug profil:",
          updateProfileError.message
        );
      }
    }

    // 5️⃣ Réponse finale
    return res.status(201).json({
      user: {
        id: user.id,
        email,
        role,
        slug: createdEntreprise?.slug ?? null,
      },
      profile: {
        id: user.id,
        role,
        first_name: entreprise?.prenom ?? null,
        last_name: entreprise?.nom ?? null,
      },
      entreprise: createdEntreprise,
    });
  } catch (err: any) {
    console.error("💥 Exception /api/auth/register:", err);
    return res.status(500).json({ error: err.message || "Erreur serveur" });
  }
}
