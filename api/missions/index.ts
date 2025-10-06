// api/missions/index.ts
// -------------------------------------------------------------
// Endpoint unifié de gestion des missions
// -------------------------------------------------------------
//
// 📌 Description :
//   - GET  /api/missions → liste les missions de l'utilisateur connecté
//   - POST /api/missions → crée une mission
//
// 🔒 Règles d’accès :
//   - Auth obligatoire
//   - Entreprise/freelance/admin → missions de leur entreprise
//   - Client → missions où client_id = user.id
//   - Public (non connecté) → POST autorisé mais mission sans client_id/entreprise_id
//
// ⚠️ Remarques :
//   - Retourne toujours slots + entreprise + client liés
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../_supabase.js";
import type { Tables } from "../../types/database.js";
import { getUserFromToken } from "../utils/auth.js";
import { canAccessSensitive, findEntreprise } from "../_lib/entreprise.js";

interface MissionWithRelations extends Tables<"missions"> {
  slots?: Tables<"slots">[];
  entreprise?: Tables<"entreprise"> | null;
  client?: Tables<"clients"> | null;
}

const ENTREPRISE_ROLES = new Set(["entreprise", "freelance", "admin"]);
const MISSION_SELECT =
  "*, slots(*), entreprise:entreprise_id(*), client:client_id(*)";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = await getUserFromToken(req);
    const role = user?.user_metadata?.role || user?.app_metadata?.role || null;

    // ---------------- GET ----------------
    if (req.method === "GET") {
      if (!user || !role) {
        return res.status(401).json({ error: "❌ Authentification requise" });
      }

      // --- Entreprise / Freelance / Admin ---
      if (ENTREPRISE_ROLES.has(role)) {
        const entrepriseLookup =
          (req.query.entreprise_ref as string | undefined) ||
          (req.query.entreprise_id as string | undefined) ||
          user.user_metadata?.entreprise_id ||
          user.id;

        const { data: entreprise, error: entrepriseError } =
          await findEntreprise(entrepriseLookup);

        if (entrepriseError)
          return res.status(500).json({ error: entrepriseError.message });
        if (!entreprise)
          return res.status(404).json({ error: "❌ Entreprise introuvable" });
        if (!canAccessSensitive(user, entreprise))
          return res.status(403).json({ error: "❌ Accès interdit" });

        const { status } = req.query;
        let query = supabaseAdmin
          .from("missions")
          .select(MISSION_SELECT)
          .eq("entreprise_id", entreprise.id)
          .order("created_at", { ascending: false });

        if (status && typeof status === "string") {
          query = query.eq("status", status);
        }

        const { data, error } = await query;
        if (error) return res.status(500).json({ error: error.message });

        return res
          .status(200)
          .json({ missions: data as MissionWithRelations[] });
      }

      // --- Client ---
      if (role === "client") {
        const { data, error } = await supabaseAdmin
          .from("missions")
          .select(MISSION_SELECT)
          .eq("client_id", user.id)
          .order("created_at", { ascending: false });

        if (error) return res.status(500).json({ error: error.message });

        return res
          .status(200)
          .json({ missions: data as MissionWithRelations[] });
      }

      return res.status(403).json({ error: "❌ Rôle non autorisé" });
    }

    // ---------------- POST ----------------
    if (req.method === "POST") {
      const payload =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
      const { slots, entreprise_ref, ...missionPayload } = payload;
      console.log("payload", payload);

      // --- Entreprise / Freelance / Admin ---
      if (user && role && ENTREPRISE_ROLES.has(role)) {
        const { data: entreprise, error: entrepriseError } =
          await findEntreprise(
            missionPayload?.entreprise_id ??
              entreprise_ref ??
              user.user_metadata?.entreprise_id ??
              user.id
          );

        if (entrepriseError)
          return res.status(500).json({ error: entrepriseError.message });
        if (!entreprise)
          return res.status(404).json({ error: "❌ Entreprise introuvable" });
        if (!canAccessSensitive(user, entreprise))
          return res.status(403).json({ error: "❌ Accès interdit" });

        // 🔑 Ici on force entreprise_id avec l'id résolu
        const { data: mission, error: missionError } = await supabaseAdmin
          .from("missions")
          .insert({
            ...missionPayload,
            entreprise_id: entreprise.id,
            client_id: missionPayload.client_id ?? null,
            status: missionPayload.status || "proposed",
          })
          .select()
          .single();

        if (missionError)
          return res.status(500).json({ error: missionError.message });

        if (slots?.length) {
          await supabaseAdmin.from("slots").insert(
            slots.map((s: any) => ({
              ...s,
              mission_id: mission.id,
              entreprise_id: entreprise.id, // ✅ attach slots à la bonne entreprise
            }))
          );
        }

        return res.status(201).json({ mission });
      }

      // --- Client connecté ---
      if (user && role === "client") {
        // ⚡ Ici on map aussi entreprise_ref si fourni
        let entrepriseId: number | null = null;
        if (entreprise_ref) {
          const { data: entreprise } = await findEntreprise(entreprise_ref);
          entrepriseId = entreprise?.id ?? null;
        }

        const { data: mission, error: missionError } = await supabaseAdmin
          .from("missions")
          .insert({
            ...missionPayload,
            client_id: user.id,
            entreprise_id: entrepriseId,
            status: "proposed",
          })
          .select()
          .single();

        if (missionError)
          return res.status(500).json({ error: missionError.message });

        if (slots?.length) {
          await supabaseAdmin.from("slots").insert(
            slots.map((s: any) => ({
              ...s,
              mission_id: mission.id,
              entreprise_id: entrepriseId,
            }))
          );
        }

        return res.status(201).json({ mission });
      }

      // --- Public (non connecté) ---
      if (!user) {
        let entrepriseId: number | null = null;

        if (entreprise_ref) {
          const { data: entreprise, error: entrepriseError } =
            await findEntreprise(entreprise_ref);

          if (entrepriseError)
            return res.status(500).json({ error: entrepriseError.message });
          if (!entreprise)
            return res.status(404).json({ error: "❌ Entreprise introuvable" });

          entrepriseId = entreprise.id;
        }

        const { data: mission, error: missionError } = await supabaseAdmin
          .from("missions")
          .insert({
            ...missionPayload,
            entreprise_id: entrepriseId, // ⚡ toujours rattaché à une entreprise
            client_id: null, // ⚡ jamais pour public
            status: "proposed",
          })
          .select()
          .single();

        if (missionError)
          return res.status(500).json({ error: missionError.message });

        if (slots?.length) {
          await supabaseAdmin.from("slots").insert(
            slots.map((s: any) => ({
              ...s,
              mission_id: mission.id,
              entreprise_id: entrepriseId,
            }))
          );
        }

        return res.status(201).json({ mission });
      }
    }

    return res.status(405).json({ error: "❌ Méthode non autorisée" });
  } catch (err: any) {
    console.error("❌ Exception missions/index:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
