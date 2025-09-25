// api/entreprises/[ref]/factures/[id]/payment-link.ts
// -------------------------------------------------------------
// Génère un lien de paiement Stripe pour une facture donnée
// -------------------------------------------------------------
//
// Étapes :
// 1. Vérifie l’authentification de l’utilisateur (JWT)
// 2. Vérifie que le user est bien owner ou admin de l’entreprise
// 3. Récupère la facture en base
// 4. Crée une session Checkout Stripe avec le montant TTC
// 5. Sauvegarde session_id, payment_intent et lien de paiement en base
// 6. Retourne { url } pour rediriger ou partager
//
// ⚠️ Notes :
// - Le statut de la facture est mis à jour en `paiement_en_attente`
// - L’état final sera confirmé via le webhook Stripe
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { supabaseAdmin } from "../../../../_supabase.js";

// -----------------------------
// Initialisation Stripe
// -----------------------------
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
    // 🔐 Vérification utilisateur
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: "Non authentifié" });

    // 🔎 Récupération entreprise
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

    // 🔎 Récupération facture
    const { data: facture, error: errFacture } = await supabaseAdmin
      .from("factures")
      .select("*")
      .eq("id", Number(id))
      .eq("entreprise_id", entreprise.id)
      .single();

    if (errFacture || !facture) {
      return res.status(404).json({ error: "Facture introuvable" });
    }

    console.log("💳 Création session Stripe pour facture:", facture.id);

    // 💳 Création session Checkout Stripe
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
            unit_amount: Math.round(Number(facture.montant_ttc) * 100), // en cents
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.APP_URL}/entreprise/${entreprise.slug}/factures/${facture.id}?paid=1`,
      cancel_url: `${process.env.APP_URL}/entreprise/${entreprise.slug}/factures/${facture.id}?canceled=1`,
      metadata: {
        facture_id: facture.id.toString(),
        entreprise_id: entreprise.id.toString(),
      },
    });

    // 💾 Sauvegarde infos Stripe dans la facture
    const { error: errUpdate } = await supabaseAdmin
      .from("factures")
      .update({
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent,
        payment_link: session.url,
        status: "paiement_en_attente",
      })
      .eq("id", facture.id);

    if (errUpdate) {
      console.error("❌ Erreur update facture:", errUpdate);
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
