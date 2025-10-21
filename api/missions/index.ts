// api/missions/index.ts
// -------------------------------------------------------------
// Endpoint unifié de gestion des missions
// -------------------------------------------------------------
//
// 📌 Description :
//   - GET  /api/missions → liste les missions selon le rôle utilisateur
//   - POST /api/missions → création d'une mission
//
// 🔒 Règles d’accès :
//   - Auth obligatoire pour GET
//   - POST :
//       • freelance / entreprise / admin → création complète
//       • client → création liée à son compte
//       • public (non connecté) → création autorisée, mission anonyme
//
// ⚠️ Remarques :
//   - Inclut toujours slots + entreprise + client
//   - Rôle issu de user.role (AuthUser enrichi)
//   - Suppression totale de user_metadata / app_metadata
//
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

const ENTREPRISE_ROLES = new Set(["freelance", "entreprise", "admin"]);
const MISSION_SELECT =
  "*, slots(*), entreprise:entreprise_id(*), client:client_id(*)";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // 🔑 Auth facultative pour POST public
    const user = await getUserFromToken(req).catch(() => null);
    const role = user?.role ?? null;

    // -------------------------------------------------------------
    // 📖 GET → Liste des missions
    // -------------------------------------------------------------
    if (req.method === "GET") {
      if (!user || !role) {
        return res.status(401).json({ error: "❌ Authentification requise" });
      }

      // ----- Freelance / Entreprise / Admin -----
      if (ENTREPRISE_ROLES.has(role)) {
        const entrepriseRef =
          (req.query.entreprise_ref as string | undefined) ||
          (req.query.entreprise_id as string | undefined) ||
          user.slug || // ton AuthUser enrichi contient slug de l’entreprise
          user.id;

        const { data: entreprise, error: entrepriseError } =
          await findEntreprise(entrepriseRef);

        if (entrepriseError) {
          console.error("❌ Erreur fetch entreprise:", entrepriseError.message);
          return res.status(500).json({ error: entrepriseError.message });
        }
        if (!entreprise) {
          return res.status(404).json({ error: "❌ Entreprise introuvable" });
        }
        if (!canAccessSensitive(user, entreprise)) {
          return res.status(403).json({ error: "❌ Accès interdit" });
        }

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
        if (error) {
          console.error("❌ Erreur fetch missions entreprise:", error.message);
          return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ missions: data ?? [] });
      }

      // ----- Client -----
      if (role === "client") {
        const { data, error } = await supabaseAdmin
          .from("missions")
          .select(MISSION_SELECT)
          .eq("client_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("❌ Erreur fetch missions client:", error.message);
          return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ missions: data ?? [] });
      }

      return res.status(403).json({ error: "❌ Rôle non autorisé" });
    }

    // -------------------------------------------------------------
    // ✏️ POST → Création d'une mission
    // -------------------------------------------------------------
    if (req.method === "POST") {
      const payload =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
      const { slots, entreprise_ref, ...missionPayload } = payload;

      // ----- Freelance / Entreprise / Admin -----
      if (user && ENTREPRISE_ROLES.has(role ?? "")) {
        const entrepriseRef =
          missionPayload?.entreprise_id ??
          entreprise_ref ??
          user.slug ??
          user.id;

        const { data: entreprise, error: entrepriseError } =
          await findEntreprise(entrepriseRef);

        if (entrepriseError) {
          console.error("❌ Erreur fetch entreprise:", entrepriseError.message);
          return res.status(500).json({ error: entrepriseError.message });
        }
        if (!entreprise) {
          return res.status(404).json({ error: "❌ Entreprise introuvable" });
        }
        if (!canAccessSensitive(user, entreprise)) {
          return res.status(403).json({ error: "❌ Accès interdit" });
        }

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

        if (missionError) {
          console.error("❌ Erreur création mission:", missionError.message);
          return res.status(500).json({ error: missionError.message });
        }

        if (slots?.length) {
          await supabaseAdmin.from("slots").insert(
            slots.map((s: any) => ({
              ...s,
              mission_id: mission.id,
              entreprise_id: entreprise.id,
            }))
          );
        }

        return res.status(201).json({ mission });
      }

      // ----- Client connecté -----
      if (user && role === "client") {
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

        if (missionError) {
          console.error(
            "❌ Erreur création mission client:",
            missionError.message
          );
          return res.status(500).json({ error: missionError.message });
        }

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

      // ----- Public non connecté -----
      if (!user) {
        let entrepriseId: number | null = null;

        if (entreprise_ref) {
          const { data: entreprise, error: entrepriseError } =
            await findEntreprise(entreprise_ref);

          if (entrepriseError) {
            console.error(
              "❌ Erreur fetch entreprise (public):",
              entrepriseError.message
            );
            return res.status(500).json({ error: entrepriseError.message });
          }
          if (!entreprise) {
            return res.status(404).json({ error: "❌ Entreprise introuvable" });
          }

          entrepriseId = entreprise.id;
        }

        const { data: mission, error: missionError } = await supabaseAdmin
          .from("missions")
          .insert({
            ...missionPayload,
            entreprise_id: entrepriseId,
            client_id: null,
            status: "proposed",
          })
          .select()
          .single();

        if (missionError) {
          console.error(
            "❌ Erreur création mission publique:",
            missionError.message
          );
          return res.status(500).json({ error: missionError.message });
        }

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

    // -------------------------------------------------------------
    // 🚫 Méthode non autorisée
    // -------------------------------------------------------------
    return res.status(405).json({ error: "❌ Méthode non autorisée" });
  } catch (err: any) {
    console.error("💥 Exception /api/missions/index:", err);
    return res.status(500).json({ error: err.message || "Erreur serveur" });
  }
}
