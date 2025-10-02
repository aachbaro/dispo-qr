// api/missions/[id].ts
// -------------------------------------------------------------
// Gestion d'une mission spécifique (lecture, mise à jour, suppression)
// -------------------------------------------------------------
//
// 📌 Endpoints :
//   - GET    /api/missions/[id]
//   - PUT    /api/missions/[id]
//   - DELETE /api/missions/[id]
//
// 🔒 Règles d'accès :
//   - Authentification obligatoire
//   - Entreprise/freelance/admin → accès complet à leurs missions
//   - Client → accès lecture seule à ses missions
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../_supabase.js";
import type { Tables } from "../../types/database.js";
import { getUserFromToken } from "../utils/auth.js";
import { canAccessSensitive, findEntreprise } from "../_lib/entreprise.js";

const ENTREPRISE_ROLES = new Set(["entreprise", "freelance", "admin"]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: "❌ Paramètres invalides" });
  }

  const missionId = Number(id);
  if (Number.isNaN(missionId)) {
    return res.status(400).json({ error: "❌ ID mission invalide" });
  }

  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: "❌ Non authentifié" });
    }

    const role =
      (user.user_metadata?.role as string | undefined) ||
      (user.app_metadata?.role as string | undefined);

    const { data: missionRecord, error: missionFetchError } = await supabaseAdmin
      .from("missions")
      .select("*, entreprise:entreprise_id(*)")
      .eq("id", missionId)
      .single<{
        entreprise?: Tables<"entreprise"> | null;
      } & Tables<"missions">>();

    if (missionFetchError) {
      console.error("❌ Erreur fetch mission:", missionFetchError.message);
      if (missionFetchError.code === "PGRST116") {
        return res.status(404).json({ error: "❌ Mission introuvable" });
      }
      return res.status(500).json({ error: missionFetchError.message });
    }

    if (!missionRecord) {
      return res.status(404).json({ error: "❌ Mission introuvable" });
    }

    const entreprise = missionRecord.entreprise || null;

    const hasEntrepriseAccess =
      entreprise && canAccessSensitive(user, entreprise as Tables<"entreprise">);

    if (ENTREPRISE_ROLES.has(role ?? "")) {
      if (!entreprise) {
        const { data: entrepriseById, error: entrepriseError } =
          await findEntreprise(missionRecord.entreprise_id);
        if (entrepriseError) {
          console.error(
            "❌ Erreur fetch entreprise mission:",
            entrepriseError.message
          );
          return res.status(500).json({ error: entrepriseError.message });
        }
        if (!entrepriseById || !canAccessSensitive(user, entrepriseById)) {
          return res.status(403).json({ error: "❌ Accès interdit" });
        }
      } else if (!hasEntrepriseAccess) {
        return res.status(403).json({ error: "❌ Accès interdit" });
      }
    } else if (role === "client") {
      if (missionRecord.client_id !== user.id) {
        return res.status(403).json({ error: "❌ Accès interdit" });
      }
    } else {
      return res.status(403).json({ error: "❌ Rôle non autorisé" });
    }

    if (req.method === "GET") {
      const { data: mission, error: missionError } = await supabaseAdmin
        .from("missions")
        .select("*, slots(*), entreprise:entreprise_id(slug)")
        .eq("id", missionId)
        .single();

      if (missionError) {
        console.error("❌ Erreur lecture mission:", missionError.message);
        return res.status(500).json({ error: missionError.message });
      }

      if (!mission) {
        return res.status(404).json({ error: "❌ Mission introuvable" });
      }

      const { slots, entreprise: missionEntreprise, ...rest } = mission as any;
      const payload: any = {
        ...rest,
        ...(Array.isArray(slots) ? { slots } : {}),
      };
      if (missionEntreprise?.slug) {
        payload.entreprise_slug = missionEntreprise.slug;
      }

      return res.status(200).json({ mission: payload });
    }

    if (req.method === "PUT") {
      if (!ENTREPRISE_ROLES.has(role ?? "")) {
        return res
          .status(403)
          .json({ error: "❌ Accès réservé au propriétaire" });
      }

      const payload =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

      const { slots, ...updates } = payload as Partial<Tables<"missions">> & {
        slots?: Array<Pick<Tables<"slots">, "start" | "end" | "title">>;
      };

      if (
        updates.status &&
        ![
          "proposed",
          "validated",
          "pending_payment",
          "paid",
          "completed",
          "refused",
          "realized",
        ].includes(updates.status)
      ) {
        return res.status(400).json({ error: "❌ Statut invalide" });
      }

      const { data: updatedMission, error: updateError } = await supabaseAdmin
        .from("missions")
        .update(updates)
        .eq("id", missionId)
        .eq("entreprise_id", missionRecord.entreprise_id)
        .select()
        .single<Tables<"missions">>();

      if (updateError) {
        console.error("❌ Erreur update mission:", updateError.message);
        return res.status(500).json({ error: updateError.message });
      }

      if (Array.isArray(slots)) {
        await supabaseAdmin.from("slots").delete().eq("mission_id", missionId);

        if (slots.length > 0) {
          const insertSlots = slots.map((slot) => ({
            start: slot.start,
            end: slot.end,
            title: slot.title || null,
            mission_id: missionId,
            entreprise_id: missionRecord.entreprise_id,
          }));

          const { error: slotError } = await supabaseAdmin
            .from("slots")
            .insert(insertSlots);

          if (slotError) {
            console.error("❌ Erreur update slots:", slotError.message);
            return res.status(500).json({ error: slotError.message });
          }
        }
      }

      return res.status(200).json({ mission: updatedMission });
    }

    if (req.method === "DELETE") {
      if (!ENTREPRISE_ROLES.has(role ?? "")) {
        return res
          .status(403)
          .json({ error: "❌ Accès réservé au propriétaire" });
      }

      const { error } = await supabaseAdmin
        .from("missions")
        .delete()
        .eq("id", missionId)
        .eq("entreprise_id", missionRecord.entreprise_id);

      if (error) {
        console.error("❌ Erreur suppression mission:", error.message);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ message: "✅ Mission supprimée" });
    }

    return res.status(405).json({ error: "❌ Méthode non autorisée" });
  } catch (err: any) {
    console.error("❌ Exception mission/[id] :", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
