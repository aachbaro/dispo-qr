// api/stripe/webhook.ts
// -------------------------------------------------------------
// Webhook Stripe - Suivi des paiements
// -------------------------------------------------------------
//
// URL (dev) : http://localhost:3000/api/stripe/webhook
//
// Fonctionnement :
// - Désactive bodyParser (Stripe exige le raw body pour vérifier la signature)
// - Vérifie la signature Stripe via STRIPE_WEBHOOK_SECRET
// - Gère les événements principaux :
//    • checkout.session.completed → facture marquée comme "payée"
//    • payment_intent.payment_failed → facture marquée comme "annulée"
// - Met à jour la table `factures` dans Supabase
//
// Bonnes pratiques :
// - Toujours logguer l’event type reçu
// - Ne jamais répondre 200 si traitement échoue
// - Conserver des logs clairs en cas de problème
//
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { supabaseAdmin } from "../_supabase.js";

// -----------------------------
// Initialisation Stripe
// -----------------------------
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

// Stripe requiert l'accès au body brut
export const config = {
  api: {
    bodyParser: false,
  },
};

// -----------------------------
// Helpers
// -----------------------------
/**
 * Récupère le corps brut de la requête (sans parsing JSON).
 */
function rawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", (err) => reject(err));
  });
}

// -----------------------------
// Handler principal
// -----------------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).send("Méthode non autorisée");
  }

  const sig = req.headers["stripe-signature"];
  if (!sig) {
    return res.status(400).send("Signature manquante");
  }

  let event: Stripe.Event;
  try {
    const buf = await rawBody(req); // ⚡ Récupère le body brut
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    console.error("❌ Erreur signature Stripe:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log("✅ Webhook reçu:", event.type);

  try {
    switch (event.type) {
      // ✅ Paiement validé
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const factureId = session.metadata?.facture_id;

        if (factureId) {
          await supabaseAdmin
            .from("factures")
            .update({
              status: "payé",
              stripe_session_id: session.id,
              stripe_payment_intent: session.payment_intent,
            })
            .eq("id", factureId);

          console.log(`✅ Facture ${factureId} marquée comme payée`);
        } else {
          console.error("❌ Facture ID manquant dans metadata");
        }
        break;
      }

      // ⚠️ Paiement échoué
      case "payment_intent.payment_failed": {
        const intent = event.data.object as Stripe.PaymentIntent;
        const factureId = intent.metadata?.facture_id;

        if (factureId) {
          await supabaseAdmin
            .from("factures")
            .update({ status: "annulée" })
            .eq("id", factureId);

          console.log(`⚠️ Facture ${factureId} marquée comme annulée`);
        } else {
          console.error("❌ Facture ID manquant dans metadata");
        }
        break;
      }

      // 🔎 Autres events ignorés
      default:
        console.log(`ℹ️ Event ignoré: ${event.type}`);
    }

    return res.json({ received: true });
  } catch (err) {
    console.error("❌ Erreur traitement webhook:", err);
    return res.status(500).send("Erreur serveur webhook");
  }
}
