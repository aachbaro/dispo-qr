// api/entreprises/[ref]/slots/index.ts
// -------------------------------------------------------------
// Gestion des slots d’une entreprise
// -------------------------------------------------------------
//
// 📍 Endpoints :
//   - GET  /api/entreprises/[ref]/slots → liste slots (+ missions)
//   - POST /api/entreprises/[ref]/slots → création slot
//
// 🔒 Accès :
//   - GET public mais filtrage selon statut mission
//   - POST réservé owner/admin
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

function canAccessSensitive(
  user: any,
  entreprise: Tables<"entreprise">
): boolean {
  if (!user) return false;
  if (user.id === entreprise.user_id) return true;
  if (user.app_metadata?.role === "admin") return true;
  return false;
}

async function findEntreprise(ref: string) {
  let query = supabaseAdmin.from("entreprise").select("*");
  if (!isNaN(Number(ref))) query = query.eq("id", Number(ref));
  else query = query.eq("slug", ref);
  return query.single<Tables<"entreprise">>();
}

// ----------------------
// Handler principal
// ----------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { ref } = req.query;
  if (!ref || typeof ref !== "string") {
    return res
      .status(400)
      .json({ error: "❌ Paramètre ref manquant ou invalide" });
  }

  try {
    const user = await getUserFromToken(req);

    // 🔎 Vérifie entreprise
    const { data: entreprise, error: entrepriseError } = await findEntreprise(
      ref
    );
    if (entrepriseError) {
      console.error("❌ Erreur fetch entreprise:", entrepriseError.message);
      return res.status(500).json({ error: entrepriseError.message });
    }
    if (!entreprise)
      return res.status(404).json({ error: "❌ Entreprise non trouvée" });

    // ----------------------
    // GET → Lister slots
    // ----------------------
    if (req.method === "GET") {
      const { from, to, mission_id } = req.query;

      let query = supabaseAdmin
        .from("slots")
        .select("*, missions(status)")
        .eq("entreprise_id", entreprise.id)
        .order("start", { ascending: true });

      if (mission_id && typeof mission_id === "string") {
        query = query.eq("mission_id", Number(mission_id));
      }
      if (from && typeof from === "string") query = query.gte("start", from);
      if (to && typeof to === "string") query = query.lte("end", to);

      const { data, error } = await query;
      if (error) return res.status(500).json({ error: error.message });

      let slots =
        (data as (Tables<"slots"> & { missions?: { status: string } })[]) ?? [];

      if (!canAccessSensitive(user, entreprise)) {
        // 🌍 Utilisateur externe → masquer slots de missions non validées
        slots = slots.filter(
          (s) =>
            !s.mission_id ||
            ["validated", "paid", "completed"].includes(
              s.missions?.status ?? ""
            )
        );
      } else {
        // 👤 Owner/admin → flag slots selon statut mission
        slots = slots.map((s) => {
          if (
            s.mission_id &&
            ["proposed", "refused"].includes(s.missions?.status ?? "")
          ) {
            return { ...s, status_slot: "pending" };
          }
          return { ...s, status_slot: "active" };
        });
      }

      return res.status(200).json({ slots });
    }

    // ----------------------
    // POST → Créer slot
    // ----------------------
    if (req.method === "POST") {
      if (!canAccessSensitive(user, entreprise)) {
        return res.status(403).json({ error: "❌ Accès interdit" });
      }

      const payload =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body;

      let missionId: number | null = null;
      if (payload.mission_id) {
        const { data: mission, error: missionError } = await supabaseAdmin
          .from("missions")
          .select("id, entreprise_id")
          .eq("id", payload.mission_id)
          .single<Tables<"missions">>();

        if (
          missionError ||
          !mission ||
          mission.entreprise_id !== entreprise.id
        ) {
          return res.status(400).json({ error: "❌ Mission invalide" });
        }
        missionId = mission.id;
      }

      const { data, error } = await supabaseAdmin
        .from("slots")
        .insert({
          start: payload.start,
          end: payload.end,
          title: payload.title || null,
          mission_id: missionId,
          entreprise_id: entreprise.id,
        })
        .select()
        .single<Tables<"slots">>();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json({ slot: data });
    }

    return res.status(405).json({ error: "❌ Méthode non autorisée" });
  } catch (err: any) {
    console.error("❌ Exception handler slots:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
