// api/stripe/webhook.ts
// -------------------------------------------------------------
// Webhook Stripe - Suivi des paiements
// -------------------------------------------------------------
//
// 📌 Description :
//   - Vérifie la signature Stripe
//   - Gère les événements principaux :
//       • checkout.session.completed → facture marquée "paid"
//       • payment_intent.payment_failed → facture marquée "canceled"
//   - Met à jour la table `factures`
//   - Si une facture est liée à une mission, met aussi à jour `missions.status`
//
// 📍 Endpoint :
//   - POST /api/stripe/webhook
//
// 🔒 Accès :
//   - Appel uniquement par Stripe (signature requise)
//
// ⚠️ Bonnes pratiques :
//   - Toujours logguer les événements reçus
//   - Ne pas renvoyer 200 si traitement échoue
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { supabaseAdmin } from "../_supabase.js";

// -----------------------------
// Initialisation Stripe
// -----------------------------
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

// Stripe a besoin du raw body pour vérifier la signature
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
    const buf = await rawBody(req);
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

        if (!factureId) {
          console.error("❌ Facture ID manquant dans metadata");
          break;
        }

        // Récupération de la facture liée
        const { data: facture, error: factureError } = await supabaseAdmin
          .from("factures")
          .select("id, mission_id")
          .eq("id", factureId)
          .single();

        if (factureError || !facture) {
          console.error("❌ Facture introuvable:", factureError);
          break;
        }

        // Mise à jour facture → paid
        const { error: updateError } = await supabaseAdmin
          .from("factures")
          .update({
            status: "paid",
            stripe_session_id: session.id,
            stripe_payment_intent: session.payment_intent,
          })
          .eq("id", factureId);

        if (updateError) {
          console.error("❌ Erreur update facture:", updateError);
          break;
        }

        console.log(`✅ Facture ${factureId} marquée comme paid`);

        // 🔄 Si mission liée → passer mission en "paid"
        if (facture.mission_id) {
          const { error: missionError } = await supabaseAdmin
            .from("missions")
            .update({ status: "paid" })
            .eq("id", facture.mission_id);

          if (missionError) {
            console.error(
              `⚠️ Erreur mise à jour mission ${facture.mission_id}:`,
              missionError
            );
          } else {
            console.log(`✅ Mission ${facture.mission_id} marquée comme paid`);
          }
        }

        break;
      }

      // ⚠️ Paiement échoué
      case "payment_intent.payment_failed": {
        const intent = event.data.object as Stripe.PaymentIntent;
        const factureId = intent.metadata?.facture_id;

        if (!factureId) {
          console.error("❌ Facture ID manquant dans metadata");
          break;
        }

        // Mise à jour facture → canceled
        const { error } = await supabaseAdmin
          .from("factures")
          .update({ status: "canceled" })
          .eq("id", factureId);

        if (error) {
          console.error("❌ Erreur update facture canceled:", error);
        } else {
          console.log(`⚠️ Facture ${factureId} marquée comme canceled`);
        }
        break;
      }

      default:
        console.log(`ℹ️ Event ignoré: ${event.type}`);
    }

    return res.json({ received: true });
  } catch (err) {
    console.error("❌ Erreur traitement webhook:", err);
    return res.status(500).send("Erreur serveur webhook");
  }
}
