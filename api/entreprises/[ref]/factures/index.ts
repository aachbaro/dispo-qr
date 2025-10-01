// api/entreprises/[ref]/factures/index.ts
// -------------------------------------------------------------
// Gestion des factures d’une entreprise
// -------------------------------------------------------------
//
// 📌 Description :
//   - Liste toutes les factures d’une entreprise
//   - Création d’une facture (liée ou non à une mission)
//
// 📍 Endpoints :
//   - GET  /api/entreprises/[ref]/factures
//   - GET  /api/entreprises/[ref]/factures?mission_id=42
//   - POST /api/entreprises/[ref]/factures
//
// 🔒 Règles d’accès :
//   - Auth JWT obligatoire
//   - Réservé au propriétaire de l’entreprise ou admin
//
// ⚠️ Remarques :
//   - Numéro de facture unique dans une entreprise
//   - Statut par défaut = "pending_payment"
//   - Si mission liée → calcule heures & montants
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../../_supabase.js";
import type { Tables } from "../../../../types/database.js";

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

async function findEntreprise(ref: string) {
  let query = supabaseAdmin.from("entreprise").select("*");
  if (!isNaN(Number(ref))) {
    query = query.eq("id", Number(ref));
  } else {
    query = query.eq("slug", ref);
  }
  return query.single<Tables<"entreprise">>();
}

function canAccess(user: any, entreprise: Tables<"entreprise">): boolean {
  if (!user) return false;
  if (user.id === entreprise.user_id) return true;
  if (user.app_metadata?.role === "admin") return true;
  return false;
}

// ----------------------
// Handler
// ----------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { ref } = req.query;

  if (!ref || typeof ref !== "string") {
    return res.status(400).json({ error: "❌ Paramètre entreprise invalide" });
  }

  try {
    // 🔐 Auth
    const user = await getUserFromToken(req);

    // 🔎 Entreprise
    const { data: entreprise, error: entrepriseError } = await findEntreprise(
      ref
    );
    if (entrepriseError) {
      return res.status(500).json({ error: entrepriseError.message });
    }
    if (!entreprise) {
      return res.status(404).json({ error: "❌ Entreprise introuvable" });
    }
    if (!canAccess(user, entreprise)) {
      return res.status(403).json({ error: "❌ Accès interdit" });
    }

    // ----------------------
    // GET → Liste factures
    // ----------------------
    if (req.method === "GET") {
      const { mission_id } = req.query;

      let query = supabaseAdmin
        .from("factures")
        .select("*, missions(*, slots(*))")
        .eq("entreprise_id", entreprise.id)
        .order("date_emission", { ascending: false });

      if (mission_id && !isNaN(Number(mission_id))) {
        query = query.eq("mission_id", Number(mission_id));
      }

      const { data, error } = await query;
      if (error) return res.status(500).json({ error: error.message });

      return res.status(200).json({ factures: data });
    }

    // ----------------------
    // POST → Créer facture
    // ----------------------
    if (req.method === "POST") {
      const payload = req.body ? JSON.parse(req.body) : {};

      // sécurité : forcer entreprise_id
      const toInsert: Partial<Tables<"factures">> = {
        ...payload,
        entreprise_id: entreprise.id,
        mission_id: payload.mission_id || null,
        status: payload.status || "pending_payment",
      };

      // 🚀 Si mission liée → calcule heures & montants
      if (payload.mission_id) {
        const { data: slots, error: slotError } = await supabaseAdmin
          .from("slots")
          .select("start, end")
          .eq("mission_id", payload.mission_id);

        if (slotError) {
          return res.status(500).json({ error: slotError.message });
        }

        let totalHours = 0;
        for (const s of slots || []) {
          const start = new Date(s.start).getTime();
          const end = new Date(s.end).getTime();
          totalHours += (end - start) / (1000 * 60 * 60);
        }

        toInsert.hours = totalHours;
        toInsert.rate = entreprise.taux_horaire;
        toInsert.montant_ht = totalHours * entreprise.taux_horaire;
        toInsert.tva = 0; // TODO: gérer TVA plus tard
        toInsert.montant_ttc = toInsert.montant_ht + (toInsert.tva || 0);
      }

      const { data, error } = await supabaseAdmin
        .from("factures")
        .insert(toInsert)
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          return res
            .status(400)
            .json({ error: "❌ Numéro de facture déjà utilisé" });
        }
        return res.status(500).json({ error: error.message });
      }

      return res.status(201).json({ facture: data });
    }

    return res.status(405).json({ error: "❌ Méthode non autorisée" });
  } catch (err: any) {
    console.error("❌ Exception factures/index:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
