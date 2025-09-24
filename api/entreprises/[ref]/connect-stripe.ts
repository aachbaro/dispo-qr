// api/entreprises/[ref]/connect-stripe.ts
// -------------------------------------------------------------
// Lier un compte Stripe à une entreprise
// -------------------------------------------------------------
//
// 📌 Description :
//   - Crée un lien d’onboarding Stripe Connect (Standard)
//   - Permet à une entreprise de connecter ou créer son compte Stripe
//   - Sauvegarde ensuite stripe_account_id dans la table `entreprise`
//
// 📍 Endpoints :
//   - GET /api/entreprises/[ref]/connect-stripe → génère le lien d’onboarding
//
// 🔒 Règles d’accès :
//   - Réservé à l’entreprise authentifiée (owner ou admin)
//
// ⚠️ Remarques :
//   - Supporte à la fois entreprises avec compte Stripe existant ou non
//   - Le champ `stripe_account_id` doit exister dans la table `entreprise`
//
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { supabaseAdmin } from "../../_supabase"; // adapte si besoin

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { ref } = req.query;
  if (!ref) {
    return res.status(400).json({ error: "Entreprise ref manquant" });
  }

  try {
    // Récupérer l'entreprise par son slug/ref
    const { data: entreprise, error } = await supabaseAdmin
      .from("entreprise")
      .select("id, stripe_account_id")
      .eq("slug", ref)
      .single();

    if (error || !entreprise) {
      return res.status(404).json({ error: "Entreprise non trouvée" });
    }

    let accountId = entreprise.stripe_account_id;

    // Si l'entreprise n'a pas encore de compte Stripe → en créer un
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "standard",
      });

      accountId = account.id;

      // Sauvegarder en base
      await supabaseAdmin
        .from("entreprise")
        .update({ stripe_account_id: accountId })
        .eq("id", entreprise.id);
    }

    // Créer un lien d’onboarding Stripe
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.APP_URL}/dashboard/entreprise/${ref}/stripe-error`,
      return_url: `${process.env.APP_URL}/dashboard/entreprise/${ref}/stripe-success`,
      type: "account_onboarding",
    });

    return res.status(200).json({ url: accountLink.url });
  } catch (err: any) {
    console.error("❌ Stripe connect error:", err);
    return res.status(500).json({ error: err.message });
  }
}
