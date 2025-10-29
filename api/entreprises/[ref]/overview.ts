// api/entreprises/[ref]/overview.ts
// -------------------------------------------------------------
// Vue globale d’une entreprise (publique ou propriétaire)
// -------------------------------------------------------------
//
// 📌 Description :
//   - Regroupe toutes les données liées à une entreprise :
//     • Infos entreprise (publiques ou privées selon accès)
//     • Missions (avec slots, client, entreprise)
//     • Factures, slots, indisponibilités
//   - Le contenu dépend du statut utilisateur :
//       → owner/admin : données complètes
//       → visiteur/client : vue publique restreinte
//
// 📍 Endpoints :
//   - GET /api/entreprises/[ref]/overview
//       → mode="owner"  → données complètes
//       → mode="public" → données allégées
//
// 🔒 Règles d’accès :
//   - Public : accès restreint (pas de données sensibles)
//   - Authentifié (owner/admin) : accès complet via canAccessSensitive
//
// ⚠️ Remarques :
//   - `ref` peut être un slug (string) ou un id (number)
//   - combine plusieurs tables Supabase en une seule réponse JSON
//   - Les missions incluent directement leurs slots pour MissionCard
//
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../_supabase.js";
import { getUserFromToken } from "../../utils/auth.js";
import { canAccessSensitive } from "../../_lib/entreprise.js";
import type { Tables } from "../../../types/database.js";

// -------------------------------------------------------------
// Typages
// -------------------------------------------------------------

type PublicEntreprise = Pick<
  Tables<"entreprise">,
  | "id"
  | "slug"
  | "nom"
  | "prenom"
  | "adresse_ligne1"
  | "adresse_ligne2"
  | "ville"
  | "code_postal"
  | "pays"
  | "email"
  | "telephone"
  | "taux_horaire"
  | "devise"
  | "created_at"
>;

type PrivateEntreprise = Tables<"entreprise">;

// -------------------------------------------------------------
// Sélecteur relationnel pour missions
// -------------------------------------------------------------
const MISSION_SELECT =
  "*, slots(*), client:client_id(*), entreprise:entreprise_id(*)";

// -------------------------------------------------------------
// Handler principal
// -------------------------------------------------------------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "❌ Méthode non autorisée" });
  }

  const { ref } = req.query;

  try {
    if (!ref || typeof ref !== "string") {
      return res.status(400).json({ error: "Paramètre ref manquant" });
    }

    console.log("📡 [overview] Chargement entreprise pour ref:", ref);

    // 🔐 1. Récupération utilisateur (si token présent)
    const user = await getUserFromToken(req).catch(() => null);

    // 🔍 2. Récupération entreprise cible
    let entrepriseQuery = supabaseAdmin.from("entreprise").select("*");

    if (isNaN(Number(ref))) {
      entrepriseQuery = entrepriseQuery.eq("slug", ref);
    } else {
      entrepriseQuery = entrepriseQuery.eq("id", Number(ref));
    }

    const { data: entreprise, error: entrepriseError } =
      await entrepriseQuery.single();

    if (entrepriseError || !entreprise) {
      console.warn("⚠️ [overview] Aucune entreprise trouvée pour", ref);
      return res.status(404).json({ error: "Entreprise non trouvée" });
    }

    // 🔒 3. Vérification d’accès (owner/admin)
    const isOwnerOrAdmin = user
      ? await canAccessSensitive(user, entreprise)
      : false;

    // ⚡ 4. Si owner/admin → données complètes
    if (isOwnerOrAdmin) {
      console.log("🔑 [overview] Accès propriétaire/admin confirmé.");

      const [missions, factures, slots, unavailabilities] = await Promise.all([
        supabaseAdmin
          .from("missions")
          .select(MISSION_SELECT)
          .eq("entreprise_id", entreprise.id)
          .order("created_at", { ascending: false }),

        supabaseAdmin
          .from("factures")
          .select("*")
          .eq("entreprise_id", entreprise.id)
          .order("created_at", { ascending: false }),

        supabaseAdmin
          .from("slots")
          .select("*")
          .eq("entreprise_id", entreprise.id)
          .order("start", { ascending: true }),

        supabaseAdmin
          .from("unavailabilities")
          .select("*")
          .eq("entreprise_id", entreprise.id),
      ]);

      return res.status(200).json({
        mode: "owner",
        entreprise: entreprise as PrivateEntreprise,
        missions: missions.data || [],
        factures: factures.data || [],
        slots: slots.data || [],
        unavailabilities: unavailabilities.data || [],
      });
    }

    // 👁️ 5. Sinon → vue publique allégée
    console.log("👁️ [overview] Accès public pour", ref);

    const [slots, unavailabilities] = await Promise.all([
      supabaseAdmin
        .from("slots")
        .select("*, missions(status)")
        .eq("entreprise_id", entreprise.id),
      supabaseAdmin
        .from("unavailabilities")
        .select("*")
        .eq("entreprise_id", entreprise.id),
    ]);

    // 🌍 Filtrage des slots publics (missions validées/payées/completed)
    const publicSlots =
      (slots.data as (Tables<"slots"> & { missions?: { status: string } })[])?.filter(
        (s) =>
          !s.mission_id ||
          ["validated", "paid", "completed"].includes(s.missions?.status ?? "")
      ) || [];

    const publicEntreprise: PublicEntreprise = {
      id: entreprise.id,
      slug: entreprise.slug,
      nom: entreprise.nom,
      prenom: entreprise.prenom,
      adresse_ligne1: entreprise.adresse_ligne1,
      adresse_ligne2: entreprise.adresse_ligne2,
      ville: entreprise.ville,
      code_postal: entreprise.code_postal,
      pays: entreprise.pays,
      email: entreprise.email,
      telephone: entreprise.telephone,
      taux_horaire: entreprise.taux_horaire,
      devise: entreprise.devise,
      created_at: entreprise.created_at,
    };

    return res.status(200).json({
      mode: "public",
      entreprise: publicEntreprise,
      slots: publicSlots,
      unavailabilities: unavailabilities.data || [],
    });
  } catch (err: any) {
    console.error("❌ [overview] Erreur GET /overview:", err);
    return res.status(500).json({ error: "Erreur serveur interne" });
  }
}
