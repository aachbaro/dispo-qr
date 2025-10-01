// api/stripe/webhook.ts
// -------------------------------------------------------------
// Webhook Stripe - Suivi des paiements
// -------------------------------------------------------------
//
// 📌 Description :
//   - Vérifie la signature Stripe
//   - checkout.session.completed → facture = "paid"
//   - payment_intent.payment_failed → facture = "canceled"
//   - Met à jour aussi la mission si liée
//
// 📍 Endpoint : POST /api/stripe/webhook
// 🔒 Accès : uniquement Stripe (signature requise)
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { supabaseAdmin } from "../_supabase.js";

// -----------------------------
// Init Stripe
// -----------------------------
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

// Stripe a besoin du raw body → désactive bodyParser
export const config = {
  api: {
    bodyParser: false,
  },
};

// -----------------------------
// Helpers
// -----------------------------
function rawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", (err) => reject(err));
  });
}

// -----------------------------
// Handler
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
    const buf = await rawBody(req);
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    console.error("❌ Erreur vérification signature Stripe:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log("✅ Webhook reçu:", event.type);

  try {
    switch (event.type) {
      // ✅ Paiement validé
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const factureId = session.metadata?.facture_id;

        if (!factureId) {
          console.error("❌ Facture ID manquant (metadata)");
          break;
        }

        // Vérifie facture
        const { data: facture, error: factureError } = await supabaseAdmin
          .from("factures")
          .select("id, mission_id")
          .eq("id", factureId)
          .maybeSingle();

        if (factureError || !facture) {
          console.error("❌ Facture introuvable:", factureError?.message);
          break;
        }

        // Update facture
        const { error: updateError } = await supabaseAdmin
          .from("factures")
          .update({
            status: "paid",
            stripe_session_id: session.id,
            stripe_payment_intent: session.payment_intent,
          })
          .eq("id", factureId);

        if (updateError) {
          console.error("❌ Erreur update facture:", updateError.message);
          break;
        }

        console.log(`✅ Facture ${factureId} → paid`);

        // Si mission liée → update mission
        if (facture.mission_id) {
          const { error: missionError } = await supabaseAdmin
            .from("missions")
            .update({ status: "paid" })
            .eq("id", facture.mission_id);

          if (missionError) {
            console.error(
              `⚠️ Erreur update mission ${facture.mission_id}:`,
              missionError.message
            );
          } else {
            console.log(`✅ Mission ${facture.mission_id} → paid`);
          }
        }
        break;
      }

      // ⚠️ Paiement échoué
      case "payment_intent.payment_failed": {
        const intent = event.data.object as Stripe.PaymentIntent;
        const factureId = intent.metadata?.facture_id;

        if (!factureId) {
          console.error("❌ Facture ID manquant (metadata)");
          break;
        }

        const { error } = await supabaseAdmin
          .from("factures")
          .update({ status: "canceled" })
          .eq("id", factureId);

        if (error) {
          console.error("❌ Erreur update facture canceled:", error.message);
        } else {
          console.log(`⚠️ Facture ${factureId} → canceled`);
        }
        break;
      }

      default:
        console.log(`ℹ️ Event ignoré: ${event.type}`);
    }

    return res.json({ received: true });
  } catch (err: any) {
    console.error("❌ Erreur traitement webhook:", err.message);
    return res.status(500).send("Erreur serveur webhook");
  }
}
