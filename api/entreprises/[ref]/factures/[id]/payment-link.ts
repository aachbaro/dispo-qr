// api/entreprises/[ref]/factures/[id]/payment-link.ts
// -------------------------------------------------------------
// Générateur de lien de paiement Stripe pour une facture
// -------------------------------------------------------------
//
// 📌 Description :
//   - Crée une session Checkout Stripe pour la facture
//   - Retourne une URL sécurisée à partager ou rediriger
//
// 📍 Endpoints :
//   - POST /api/entreprises/[ref]/factures/[id]/payment-link
//
// 🔒 Règles d’accès :
//   - Authentification JWT requise
//   - Réservé au propriétaire de l’entreprise ou admin
//
// ⚠️ Remarques :
//   - Le statut de la facture passe en `pending_payment`
//   - Le statut final sera confirmé par le webhook Stripe
//   - Ajout du mission_id dans metadata pour faciliter le suivi
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { supabaseAdmin } from "../../../../_supabase.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

// -----------------------------
// Helpers
// -----------------------------
async function getUserFromToken(req: VercelRequest) {
  const auth = req.headers.authorization;
  if (!auth) return null;

  const token = auth.split(" ")[1];
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return null;

  return data.user;
}

function canAccess(user: any, entreprise: any) {
  if (!user) return false;
  if (user.id === entreprise.user_id) return true;
  if (user.app_metadata?.role === "admin") return true;
  return false;
}

// -----------------------------
// Handler
// -----------------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { ref, id } = req.query;

  if (!ref || !id || typeof ref !== "string" || typeof id !== "string") {
    return res.status(400).json({ error: "Paramètres invalides" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: "Non authentifié" });

    // 🔎 Entreprise
    const { data: entreprise, error: errEntreprise } = await supabaseAdmin
      .from("entreprise")
      .select("*")
      .eq(
        isNaN(Number(ref)) ? "slug" : "id",
        isNaN(Number(ref)) ? ref : Number(ref)
      )
      .single();

    if (errEntreprise || !entreprise) {
      return res.status(404).json({ error: "Entreprise introuvable" });
    }
    if (!canAccess(user, entreprise)) {
      return res.status(403).json({ error: "Accès interdit" });
    }

    // 🔎 Facture
    const { data: facture, error: errFacture } = await supabaseAdmin
      .from("factures")
      .select("*")
      .eq("id", Number(id))
      .eq("entreprise_id", entreprise.id)
      .single();

    if (errFacture || !facture) {
      return res.status(404).json({ error: "Facture introuvable" });
    }

    // 💳 Session Stripe
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_creation: "if_required",
      line_items: [
        {
          price_data: {
            currency: entreprise.devise || "eur",
            product_data: {
              name: `Facture ${facture.numero}`,
              description: facture.description || "Mission freelance",
            },
            unit_amount: Math.round(Number(facture.montant_ttc) * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.APP_URL}/entreprise/${entreprise.slug}/factures/${facture.id}?paid=1`,
      cancel_url: `${process.env.APP_URL}/entreprise/${entreprise.slug}/factures/${facture.id}?canceled=1`,
      metadata: {
        facture_id: facture.id.toString(),
        entreprise_id: entreprise.id.toString(),
        ...(facture.mission_id && {
          mission_id: facture.mission_id.toString(),
        }), // 👈 ajout mission_id si dispo
      },
    });

    // 💾 Update facture
    const { error: errUpdate } = await supabaseAdmin
      .from("factures")
      .update({
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent,
        payment_link: session.url,
        status: "pending_payment",
      })
      .eq("id", facture.id);

    if (errUpdate) {
      return res
        .status(500)
        .json({ error: "Impossible de sauvegarder le lien" });
    }

    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error("❌ Exception payment-link:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
