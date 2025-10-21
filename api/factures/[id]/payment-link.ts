// api/factures/[id]/payment-link.ts
// -------------------------------------------------------------
// Générateur de lien de paiement Stripe pour une facture
// -------------------------------------------------------------
//
// 📌 Description :
//   - POST /api/factures/[id]/payment-link → génère un lien Stripe Checkout
//
// 🔒 Règles d’accès :
//   - Authentification obligatoire (JWT Supabase)
//   - Rôle requis : "freelance", "entreprise" ou "admin"
//   - Accès restreint aux factures appartenant à l’entreprise du user
//
// ⚠️ Remarques :
//   - Les anciens champs user_metadata/app_metadata ne sont plus utilisés
//   - Validation du montant TTC avant création de la session
//   - Met à jour la facture avec le lien + session Stripe
//
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { supabaseAdmin } from "../../_supabase.js";
import type { Tables } from "../../../types/database.js";
import { getUserFromToken } from "../../utils/auth.js";
import { canAccessSensitive, findEntreprise } from "../../_lib/entreprise.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
const ENTREPRISE_ROLES = new Set(["freelance", "entreprise", "admin"]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  // --------------------------
  // ⚙️ Validation de base
  // --------------------------
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: "❌ Paramètre ID invalide" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "❌ Méthode non autorisée" });
  }

  const factureId = Number(id);
  if (Number.isNaN(factureId)) {
    return res.status(400).json({ error: "❌ ID facture invalide" });
  }

  try {
    // 🔑 Authentification
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: "❌ Non authentifié" });
    }

    const role = user.role;
    if (!ENTREPRISE_ROLES.has(role ?? "")) {
      return res
        .status(403)
        .json({ error: "❌ Accès réservé aux entreprises" });
    }

    // 🧾 Récupération de la facture
    const { data: factureRecord, error: factureError } = await supabaseAdmin
      .from("factures")
      .select("*, entreprise:entreprise_id(*)")
      .eq("id", factureId)
      .single<
        Tables<"factures"> & {
          entreprise?: Tables<"entreprise"> | null;
        }
      >();

    if (factureError) {
      console.error("❌ Erreur fetch facture:", factureError.message);
      if (factureError.code === "PGRST116") {
        return res.status(404).json({ error: "❌ Facture introuvable" });
      }
      return res.status(500).json({ error: factureError.message });
    }

    if (!factureRecord) {
      return res.status(404).json({ error: "❌ Facture introuvable" });
    }

    // 🏢 Récupération et vérification de l’entreprise liée
    let entreprise = factureRecord.entreprise || null;
    if (!entreprise) {
      const { data, error } = await findEntreprise(factureRecord.entreprise_id);
      if (error) {
        console.error(
          "❌ Erreur fetch entreprise (payment-link):",
          error.message
        );
        return res.status(500).json({ error: error.message });
      }
      entreprise = data || null;
    }

    if (!entreprise || !canAccessSensitive(user, entreprise)) {
      return res.status(403).json({ error: "❌ Accès interdit" });
    }

    // 💰 Validation du montant
    if (!factureRecord.montant_ttc || factureRecord.montant_ttc <= 0) {
      return res.status(400).json({ error: "❌ Montant TTC invalide" });
    }

    // -------------------------------------------------------------
    // 💳 Création session Stripe Checkout
    // -------------------------------------------------------------
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_creation: "if_required",
      line_items: [
        {
          price_data: {
            currency: entreprise.devise?.toLowerCase() || "eur",
            product_data: {
              name: `Facture ${factureRecord.numero}`,
              description: factureRecord.description || "Mission freelance",
            },
            unit_amount: Math.round(Number(factureRecord.montant_ttc) * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.APP_URL}/entreprise/${entreprise.slug}/factures/${factureRecord.id}?paid=1`,
      cancel_url: `${process.env.APP_URL}/entreprise/${entreprise.slug}/factures/${factureRecord.id}?canceled=1`,
      metadata: {
        facture_id: factureRecord.id.toString(),
        entreprise_id: entreprise.id.toString(),
        ...(factureRecord.mission_id && {
          mission_id: factureRecord.mission_id.toString(),
        }),
      },
    });

    // -------------------------------------------------------------
    // 🧾 Mise à jour facture en base
    // -------------------------------------------------------------
    const { error: updateError } = await supabaseAdmin
      .from("factures")
      .update({
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent?.toString() ?? null,
        payment_link: session.url,
        status: "pending_payment",
      })
      .eq("id", factureRecord.id);

    if (updateError) {
      console.error("❌ Erreur sauvegarde lien paiement:", updateError.message);
      return res.status(500).json({ error: "❌ Sauvegarde du lien échouée" });
    }

    // ✅ Retour du lien de paiement
    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error("💥 Exception /api/factures/[id]/payment-link:", err);
    return res.status(500).json({ error: err.message || "Erreur serveur" });
  }
}
