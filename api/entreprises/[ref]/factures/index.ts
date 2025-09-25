// api/entreprises/[ref]/factures/index.ts
// -------------------------------------------------------------
// Gestion des factures d’une entreprise
// -------------------------------------------------------------
//
// 📌 Description :
//   - Liste toutes les factures d’une entreprise
//   - Permet de créer une nouvelle facture
//
// 📍 Endpoints :
//   - GET  /api/entreprises/[ref]/factures  → liste factures
//   - POST /api/entreprises/[ref]/factures  → créer facture
//
// 🔒 Règles d’accès :
//   - Authentification JWT requise
//   - Réservé au propriétaire de l’entreprise ou admin
//
// ⚠️ Remarques :
//   - Le numéro de facture doit être unique dans l’entreprise
//   - Une facture peut être liée ou non à une mission
//   - Le tri se fait par date d’émission décroissante
//   - Les statuts possibles sont définis dans l’ENUM facture_status
//
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../../_supabase.js";

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

  return query.single();
}

function canAccess(user: any, entreprise: any): boolean {
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
    return res.status(400).json({ error: "Paramètre entreprise invalide" });
  }

  try {
    const user = await getUserFromToken(req);

    // 🔍 Récupération entreprise
    const { data: entreprise, error: entrepriseError } = await findEntreprise(
      ref
    );
    if (entrepriseError) {
      return res.status(500).json({ error: entrepriseError.message });
    }
    if (!entreprise) {
      return res.status(404).json({ error: "Entreprise non trouvée" });
    }

    if (!canAccess(user, entreprise)) {
      return res.status(403).json({ error: "Accès interdit" });
    }

    // ----------------------
    // GET → Liste factures
    // ----------------------
    if (req.method === "GET") {
      const { data, error } = await supabaseAdmin
        .from("factures")
        .select("*, missions(*, slots(*))") // 👈 inclut mission + slots liés
        .eq("entreprise_id", entreprise.id)
        .order("date_emission", { ascending: false });

      if (error) return res.status(500).json({ error: error.message });

      return res.status(200).json({ factures: data });
    }

    // ----------------------
    // POST → Créer facture
    // ----------------------
    if (req.method === "POST") {
      const payload = req.body;

      // sécurité : toujours forcer entreprise_id depuis le ref
      let toInsert: any = {
        ...payload,
        entreprise_id: entreprise.id,
        mission_id: payload.mission_id || null,
        status: payload.status || "pending_payment", // ✅ statut par défaut
      };

      // 🚀 Si la facture est liée à une mission → calcule heures & montants
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
          totalHours += (end - start) / (1000 * 60 * 60); // en heures
        }

        toInsert.hours = totalHours;
        toInsert.rate = entreprise.taux_horaire; // tarif de l’entreprise
        toInsert.montant_ht = totalHours * entreprise.taux_horaire;
        toInsert.tva = 0; // ou logique TVA si besoin
        toInsert.montant_ttc = toInsert.montant_ht + toInsert.tva;
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
            .json({ error: "Numéro de facture déjà utilisé." });
        }
        return res.status(500).json({ error: error.message });
      }

      return res.status(201).json({ facture: data });
    }

    return res.status(405).json({ error: "Méthode non autorisée" });
  } catch (err: any) {
    console.error("❌ Exception handler factures:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
