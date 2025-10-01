// api/auth/register.ts
// -------------------------------------------------------------
// Route : /api/auth/register
// -------------------------------------------------------------
//
// 📌 Description :
//   - POST : Crée un nouvel utilisateur dans Supabase Auth
//   - Ajoute un profil dans la table `profiles`
//   - Si role = "freelance", crée aussi une entrée dans `entreprise`
//   - Génère un slug unique pour l’entreprise
//
// 📍 Endpoints :
//   - POST /api/auth/register
//
// 🔒 Règles d’accès :
//   - Utilise la clé service role (supabaseAdmin)
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../_supabase.js";
import type { TablesInsert } from "../../types/database.js";

// ----------------------
// Helpers
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

  if (!email || !password || !role) {
    return res.status(400).json({ error: "❌ Champs obligatoires manquants" });
  }
  if (!["freelance", "client"].includes(role)) {
    return res.status(400).json({ error: "❌ Rôle invalide" });
  }

  try {
    // 1️⃣ Créer l’utilisateur
    const {
      data: { user },
      error: signUpError,
    } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role },
    });

    if (signUpError || !user) {
      console.error("❌ Erreur création user:", signUpError);
      return res
        .status(500)
        .json({ error: signUpError?.message || "Erreur création utilisateur" });
    }

    // 2️⃣ Créer le profil
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert([{ id: user.id, role }]);

    if (profileError) {
      console.error("❌ Erreur création profile:", profileError.message);
      return res.status(500).json({ error: "Erreur création profile" });
    }

    let createdEntreprise = null;

    // 3️⃣ Si freelance → créer une entreprise
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

      // 🔄 Mettre à jour metadata user
      const { error: updateError } =
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          user_metadata: {
            role,
            slug: ent.slug,
            nom: ent.nom,
            prenom: ent.prenom,
          },
        });

      if (updateError) {
        console.error("⚠️ Erreur mise à jour metadata:", updateError.message);
      }
    }

    // 4️⃣ Réponse finale
    return res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        role,
        slug: createdEntreprise?.slug ?? null,
      },
      profile: { role },
      entreprise: createdEntreprise,
    });
  } catch (err: any) {
    console.error("❌ Exception register:", err);
    return res.status(500).json({ error: err.message || "Erreur serveur" });
  }
}
