// api/factures/index.ts
// -------------------------------------------------------------
// Endpoint unifié de gestion des factures
// -------------------------------------------------------------
//
// 📌 Description :
//   - GET  /api/factures → liste les factures selon le rôle de l'utilisateur
//   - POST /api/factures → crée une facture pour l'entreprise propriétaire
//
// 🔒 Règles d’accès :
//   - Authentification obligatoire
//   - Entreprises/freelances/admin → accès aux factures de leur entreprise
//   - Clients → factures liées à leurs missions
//   - Clients en lecture seule
//
// ⚠️ Remarques :
//   - Inclut les infos complètes de l’entreprise côté client
//   - Retourne mission + slots pour compatibilité frontend
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../_supabase.js";
import type { Tables } from "../../types/database.js";
import { getUserFromToken } from "../utils/auth.js";
import { canAccessSensitive, findEntreprise } from "../_lib/entreprise.js";

interface FactureWithRelations extends Tables<"factures"> {
  missions?: (Tables<"missions"> & {
    slots?: Tables<"slots">[];
    entreprise?: Tables<"entreprise"> | null;
    client?: Tables<"clients"> | null;
  }) | null;
}

const ENTREPRISE_ROLES = new Set(["entreprise", "freelance", "admin"]);
const FACTURE_SELECT =
  "*, missions(*, slots(*), entreprise:entreprise_id(*), client:client_id(*))";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: "❌ Authentification requise" });
    }

    const role =
      (user.user_metadata?.role as string | undefined) ||
      (user.app_metadata?.role as string | undefined);

    // ---------------- GET ----------------
    if (req.method === "GET") {
      if (!role) {
        return res.status(403).json({ error: "❌ Rôle utilisateur manquant" });
      }

      // ----- Entreprise / Freelance / Admin -----
      if (ENTREPRISE_ROLES.has(role)) {
        const entrepriseLookup =
          (req.query.entreprise_ref as string | undefined) ||
          (req.query.entreprise_id as string | undefined) ||
          user.user_metadata?.entreprise_id ||
          user.id;

        const { data: entreprise, error: entrepriseError } =
          await findEntreprise(entrepriseLookup);

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
        if (error) return res.status(500).json({ error: error.message });

        return res
          .status(200)
          .json({ factures: data as FactureWithRelations[] });
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

        if (error) return res.status(500).json({ error: error.message });

        return res
          .status(200)
          .json({ factures: data as FactureWithRelations[] });
      }

      return res.status(403).json({ error: "❌ Rôle non autorisé" });
    }

    // ---------------- POST ----------------
    if (req.method === "POST") {
      if (!role || !ENTREPRISE_ROLES.has(role)) {
        return res
          .status(403)
          .json({ error: "❌ Accès réservé aux entreprises" });
      }

      const payload =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

      const { data: entreprise, error: entrepriseError } = await findEntreprise(
        (payload?.entreprise_id as string | number | undefined) ??
          user.user_metadata?.entreprise_id ??
          user.id
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

      // 📦 Construction facture
      const toInsert: Partial<Tables<"factures">> = {
        ...payload,
        entreprise_id: entreprise.id,
        mission_id: payload.mission_id || null,
        status: payload.status || "pending_payment",
      };

      // ⏳ Si mission liée → calcul heures & montant
      if (payload.mission_id) {
        const { data: slots, error: slotError } = await supabaseAdmin
          .from("slots")
          .select("start, end")
          .eq("mission_id", payload.mission_id);

        if (slotError)
          return res.status(500).json({ error: slotError.message });

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

      const { data: factureWithRelations, error: fetchCreatedError } =
        await supabaseAdmin
          .from("factures")
          .select(FACTURE_SELECT)
          .eq("id", data.id)
          .single<FactureWithRelations>();

      if (fetchCreatedError) {
        console.error(
          "❌ Erreur récupération facture créée:",
          fetchCreatedError.message
        );
        return res.status(500).json({ error: fetchCreatedError.message });
      }

      return res.status(201).json({ facture: factureWithRelations });
    }

    return res.status(405).json({ error: "❌ Méthode non autorisée" });
  } catch (err: any) {
    console.error("❌ Exception factures/index:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
