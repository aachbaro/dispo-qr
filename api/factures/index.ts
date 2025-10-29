// api/factures/index.ts
// -------------------------------------------------------------
// Endpoint unifié de gestion des factures
// -------------------------------------------------------------
//
// 📌 Description :
//   - GET  /api/factures → liste les factures selon le rôle utilisateur
//   - POST /api/factures → crée une facture pour l’entreprise propriétaire
//
// 🔒 Règles d’accès :
//   - Authentification obligatoire (JWT Supabase)
//   - "freelance" / "entreprise" / "admin" → accès complet (création + lecture)
//   - "client" → lecture seule (factures de ses missions)
//   - Accès contrôlé via canAccessSensitive(user, entreprise)
//
// ⚠️ Remarques :
//   - Le rôle vient de `user.role` (AuthUser enrichi via getUserFromToken)
//   - `entreprise` récupérée via findEntreprise()
//   - Les anciens `user_metadata` / `app_metadata` ne sont plus utilisés
//
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../_supabase.js";
import type { Tables } from "../../types/database.js";
import { getUserFromToken } from "../utils/auth.js";
import { canAccessSensitive, findEntreprise } from "../_lib/entreprise.js";
import { notify } from "../_lib/notifications.js";

interface FactureWithRelations extends Tables<"factures"> {
  missions?:
    | (Tables<"missions"> & {
        slots?: Tables<"slots">[];
        entreprise?: Tables<"entreprise"> | null;
        client?: Tables<"clients"> | null;
      })
    | null;
}

const ENTREPRISE_ROLES = new Set(["freelance", "entreprise", "admin"]);
const FACTURE_SELECT =
  "*, missions(*, slots(*), entreprise:entreprise_id(*), client:client_id(*))";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // 🔑 Authentification
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: "❌ Authentification requise" });
    }

    const role = user.role;

    // -------------------------------------------------------------
    // 📖 GET → Liste des factures
    // -------------------------------------------------------------
    if (req.method === "GET") {
      if (!role) {
        return res.status(403).json({ error: "❌ Rôle utilisateur manquant" });
      }

      // ----- Freelance / Entreprise / Admin -----
      if (ENTREPRISE_ROLES.has(role)) {
        const entrepriseRef =
          (req.query.entreprise_ref as string | undefined) ||
          (req.query.entreprise_id as string | undefined) ||
          user.slug || // priorité au slug de l'entreprise liée
          user.id;

        const { data: entreprise, error: entrepriseError } =
          await findEntreprise(entrepriseRef);

        if (entrepriseError) {
          console.error("❌ Erreur fetch entreprise:", entrepriseError.message);
          return res.status(500).json({ error: entrepriseError.message });
        }

        if (!entreprise) {
          return res
            .status(404)
            .json({ error: "❌ Entreprise associée introuvable" });
        }

        if (!canAccessSensitive(user, entreprise)) {
          return res.status(403).json({ error: "❌ Accès interdit" });
        }

        const { mission_id } = req.query;
        let query = supabaseAdmin
          .from("factures")
          .select(FACTURE_SELECT)
          .eq("entreprise_id", entreprise.id)
          .order("date_emission", { ascending: false });

        if (mission_id && !Number.isNaN(Number(mission_id))) {
          query = query.eq("mission_id", Number(mission_id));
        }

        const { data, error } = await query;
        if (error) {
          console.error("❌ Erreur fetch factures:", error.message);
          return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ factures: data ?? [] });
      }

      // ----- Client -----
      if (role === "client") {
        const { mission_id } = req.query;

        let clientQuery = supabaseAdmin
          .from("factures")
          .select(
            "*, missions!inner(*, slots(*), entreprise:entreprise_id(*), client:client_id(*))"
          )
          .eq("missions.client_id", user.id)
          .order("date_emission", { ascending: false });

        if (mission_id && !Number.isNaN(Number(mission_id))) {
          clientQuery = clientQuery.eq("mission_id", Number(mission_id));
        }

        const { data, error } = await clientQuery;
        if (error) {
          console.error("❌ Erreur fetch factures client:", error.message);
          return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ factures: data ?? [] });
      }

      // ----- Autres rôles -----
      return res.status(403).json({ error: "❌ Rôle non autorisé" });
    }

    // -------------------------------------------------------------
    // 🧾 POST → Création d’une facture
    // -------------------------------------------------------------
    if (req.method === "POST") {
      if (!role || !ENTREPRISE_ROLES.has(role)) {
        return res
          .status(403)
          .json({ error: "❌ Accès réservé aux entreprises / freelances" });
      }

      const payload =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

      const entrepriseRef =
        (payload?.entreprise_id as string | number | undefined) ??
        user.slug ??
        user.id;

      const { data: entreprise, error: entrepriseError } = await findEntreprise(
        entrepriseRef
      );

      if (entrepriseError) {
        console.error("❌ Erreur fetch entreprise:", entrepriseError.message);
        return res.status(500).json({ error: entrepriseError.message });
      }

      if (!entreprise) {
        return res
          .status(404)
          .json({ error: "❌ Entreprise associée introuvable" });
      }

      if (!canAccessSensitive(user, entreprise)) {
        return res.status(403).json({ error: "❌ Accès interdit" });
      }

      // 🧮 Construction de la facture
      const toInsert: Partial<Tables<"factures">> = {
        ...payload,
        entreprise_id: entreprise.id,
        mission_id: payload.mission_id || null,
        status: payload.status || "pending_payment",
      };

      // ⏱️ Si mission liée → calcul automatique
      if (payload.mission_id) {
        const { data: slots, error: slotError } = await supabaseAdmin
          .from("slots")
          .select("start, end")
          .eq("mission_id", payload.mission_id);

        if (slotError) {
          console.error("❌ Erreur fetch slots:", slotError.message);
          return res.status(500).json({ error: slotError.message });
        }

        let totalHours = 0;
        for (const slot of slots || []) {
          const start = new Date(slot.start!).getTime();
          const end = new Date(slot.end!).getTime();
          if (!Number.isNaN(start) && !Number.isNaN(end) && end > start) {
            totalHours += (end - start) / (1000 * 60 * 60);
          }
        }

        toInsert.hours = totalHours;
        toInsert.rate = entreprise.taux_horaire;
        toInsert.montant_ht = totalHours * (entreprise.taux_horaire || 0);
        toInsert.tva = payload.tva ?? 0;
        toInsert.montant_ttc = (toInsert.montant_ht || 0) + (toInsert.tva || 0);
      }

      const { data, error } = await supabaseAdmin
        .from("factures")
        .insert(toInsert)
        .select()
        .single<Tables<"factures">>();

      if (error) {
        if ((error as any).code === "23505") {
          return res
            .status(400)
            .json({ error: "❌ Numéro de facture déjà utilisé" });
        }
        console.error("❌ Erreur création facture:", error.message);
        return res.status(500).json({ error: error.message });
      }

      // 🔁 Rechargement avec relations
      const { data: factureWithRelations, error: fetchError } =
        await supabaseAdmin
          .from("factures")
          .select(FACTURE_SELECT)
          .eq("id", data.id)
          .single<FactureWithRelations>();

      if (fetchError) {
        console.error(
          "❌ Erreur récupération facture créée:",
          fetchError.message
        );
        return res.status(500).json({ error: fetchError.message });
      }

      const clientEmail =
        factureWithRelations?.missions?.client?.email ??
        factureWithRelations?.missions?.contact_email ??
        null;

      await notify.billingStatusChangedForEntreprise(
        {
          id: entreprise.id,
          nom: entreprise.nom,
          email: entreprise.email,
          slug: entreprise.slug,
        },
        {
          id: factureWithRelations.id,
          numero: factureWithRelations.numero,
          status: factureWithRelations.status as "pending_payment" | "paid" | "canceled",
          payment_link: factureWithRelations.payment_link,
        }
      );

      if (clientEmail) {
        await notify.invoiceCreatedToClient(
          clientEmail,
          {
            id: factureWithRelations.id,
            numero: factureWithRelations.numero,
            status: factureWithRelations.status as "pending_payment" | "paid" | "canceled",
            payment_link: factureWithRelations.payment_link,
          },
          {
            id: entreprise.id,
            nom: entreprise.nom,
            email: entreprise.email,
            slug: entreprise.slug,
          }
        );
      }

      return res.status(201).json({ facture: factureWithRelations });
    }

    // -------------------------------------------------------------
    // 🚫 Méthode non autorisée
    // -------------------------------------------------------------
    return res.status(405).json({ error: "❌ Méthode non autorisée" });
  } catch (err: any) {
    console.error("💥 Exception /api/factures/index:", err);
    return res.status(500).json({ error: err.message || "Erreur serveur" });
  }
}
