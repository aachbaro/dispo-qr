// api/entreprises/[ref]/connect-stripe.ts
// -------------------------------------------------------------
// Connecter une entreprise à Stripe (onboarding)
// -------------------------------------------------------------
//
// 📍 Endpoints :
//   - GET /api/entreprises/[ref]/connect-stripe → génère un lien onboarding
//
// 🔒 Accès :
//   - Réservé à l’entreprise authentifiée (owner ou admin)
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { supabaseAdmin } from "../../_supabase.js";
import type { Tables } from "../../../types/database.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

// ----------------------
// Helpers
// ----------------------
async function getUserFromToken(req: VercelRequest) {
  const auth = req.headers.authorization;
  if (!auth) return null;
  const token = auth.split(" ")[1];
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

function canAccess(user: any, entreprise: Tables<"entreprise">) {
  if (!user) return false;
  if (user.id === entreprise.user_id) return true;
  if (user.app_metadata?.role === "admin") return true;
  return false;
}

async function findEntreprise(ref: string) {
  let query = supabaseAdmin.from("entreprise").select("*");
  if (!isNaN(Number(ref))) query = query.eq("id", Number(ref));
  else query = query.eq("slug", ref);
  return query.single<Tables<"entreprise">>();
}

// ----------------------
// Handler principal
// ----------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "❌ Méthode non autorisée" });
  }

  const { ref } = req.query;
  if (!ref || typeof ref !== "string") {
    return res
      .status(400)
      .json({ error: "❌ Paramètre ref manquant ou invalide" });
  }

  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: "❌ Non authentifié" });

    // 🔎 Vérifie entreprise
    const { data: entreprise, error } = await findEntreprise(ref);
    if (error || !entreprise) {
      return res.status(404).json({ error: "❌ Entreprise non trouvée" });
    }
    if (!canAccess(user, entreprise)) {
      return res.status(403).json({ error: "❌ Accès interdit" });
    }

    let accountId = entreprise.stripe_account_id;

    // 🆕 Créer compte Stripe si inexistant
    if (!accountId) {
      const account = await stripe.accounts.create({ type: "standard" });
      accountId = account.id;

      const { error: updateError } = await supabaseAdmin
        .from("entreprise")
        .update({ stripe_account_id: accountId })
        .eq("id", entreprise.id);

      if (updateError) {
        console.error(
          "⚠️ Erreur update stripe_account_id:",
          updateError.message
        );
      }
    }

    // 🔗 Génère un lien d’onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.APP_URL}/dashboard/entreprise/${entreprise.slug}/stripe-error`,
      return_url: `${process.env.APP_URL}/dashboard/entreprise/${entreprise.slug}/stripe-success`,
      type: "account_onboarding",
    });

    return res.status(200).json({ url: accountLink.url });
  } catch (err: any) {
    console.error("❌ Exception connect-stripe:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
