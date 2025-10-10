// api/entreprises/[ref]/unavailabilities/[id].ts
// -------------------------------------------------------------
// Gestion d’une indisponibilité spécifique
// -------------------------------------------------------------
//
// 📌 Description :
//   - Permet la mise à jour ou la suppression d’une indisponibilité
//   - Peut servir à ajouter une exception à une récurrence
//
// 📍 Endpoints :
//   - PUT    /api/entreprises/[ref]/unavailabilities/[id] → update
//   - DELETE /api/entreprises/[ref]/unavailabilities/[id] → delete
//
// 🔒 Accès :
//   - Réservé owner/admin
//
// ⚠️ Remarques :
//   - Si on veut “supprimer une occurrence” d’une récurrence,
//     on ajoute simplement la date dans `exceptions`
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../../_supabase.js";
import type { Tables } from "../../../../types/database.js";
import { getUserFromToken } from "../../../utils/auth.js";
import {
  canAccessSensitive,
  findEntreprise,
} from "../../../_lib/entreprise.js";

// ----------------------
// Handler principal
// ----------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { ref, id } = req.query;

  if (!ref || typeof ref !== "string" || !id || isNaN(Number(id))) {
    return res.status(400).json({ error: "❌ Invalid entreprise ref or id" });
  }

  try {
    const user = await getUserFromToken(req);

    // Vérifie l’entreprise
    const { data: entreprise, error: entrepriseError } = await findEntreprise(
      ref
    );
    if (entrepriseError) {
      console.error("❌ Error fetching entreprise:", entrepriseError.message);
      return res.status(500).json({ error: entrepriseError.message });
    }
    if (!entreprise)
      return res.status(404).json({ error: "❌ Entreprise not found" });

    if (!canAccessSensitive(user, entreprise)) {
      return res.status(403).json({ error: "❌ Access denied" });
    }

    // ----------------------
    // PUT → Update unavailability
    // ----------------------
    if (req.method === "PUT") {
      const payload =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body;

      const updateData: Partial<Tables<"unavailabilities">> = {
        ...(payload.title && { title: payload.title }),
        ...(payload.start_time && { start_time: payload.start_time }),
        ...(payload.end_time && { end_time: payload.end_time }),
        ...(payload.recurrence_type && {
          recurrence_type: payload.recurrence_type,
        }),
        ...(payload.start_date && { start_date: payload.start_date }),
        ...(payload.recurrence_end && {
          recurrence_end: payload.recurrence_end,
        }),
        ...(payload.weekday !== undefined && { weekday: payload.weekday }),
        ...(payload.exceptions && { exceptions: payload.exceptions }),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabaseAdmin
        .from("unavailabilities")
        .update(updateData)
        .eq("id", Number(id))
        .eq("entreprise_id", entreprise.id)
        .select()
        .single<Tables<"unavailabilities">>();

      if (error) {
        console.error("❌ Error updating unavailability:", error.message);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ unavailability: data });
    }

    // ----------------------
    // DELETE → Delete unavailability (full or single occurrence)
    // ----------------------
    if (req.method === "DELETE") {
      const { date } = req.query;

      if (date && typeof date === "string") {
        const { data, error } = await supabaseAdmin
          .from("unavailabilities")
          .select("exceptions")
          .eq("id", Number(id))
          .single();

        if (error) {
          console.error("❌ Error fetching exceptions:", error.message);
          return res.status(500).json({ error: error.message });
        }

        const exceptions = (data?.exceptions as string[]) || [];
        if (!exceptions.includes(date)) {
          exceptions.push(date);
        }

        const { error: updateError } = await supabaseAdmin
          .from("unavailabilities")
          .update({ exceptions })
          .eq("id", Number(id))
          .eq("entreprise_id", entreprise.id);

        if (updateError) {
          console.error(
            "❌ Error updating unavailability exceptions:",
            updateError.message
          );
          return res.status(500).json({ error: updateError.message });
        }

        return res.status(200).json({ success: true, partial: true });
      }

      const { error } = await supabaseAdmin
        .from("unavailabilities")
        .delete()
        .eq("id", Number(id))
        .eq("entreprise_id", entreprise.id);

      if (error) {
        console.error("❌ Error deleting unavailability:", error.message);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "❌ Method not allowed" });
  } catch (err: any) {
    console.error("❌ Exception handler unavailabilities/[id]:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
