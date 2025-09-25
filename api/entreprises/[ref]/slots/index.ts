// api/entreprises/[ref]/slots/index.ts
// -------------------------------------------------------------
// Route slots entreprise : /api/entreprises/[ref]/slots
//
// - GET : Lister les slots d’une entreprise (et éventuellement par mission_id)
// - POST : Créer un slot (lié à une mission ou libre)
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../../_supabase.js";

async function getUserFromToken(req: VercelRequest) {
  const auth = req.headers.authorization;
  if (!auth) return null;
  const token = auth.split(" ")[1];
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

function canAccessSensitive(user: any, entreprise: any): boolean {
  if (!user) return false;
  if (user.id === entreprise.user_id) return true;
  if (user.app_metadata?.role === "admin") return true;
  return false;
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

// ----------------------
// Handler principal
// ----------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { ref } = req.query;
  if (!ref || typeof ref !== "string") {
    return res
      .status(400)
      .json({ error: "Paramètre ref manquant ou invalide" });
  }

  try {
    const user = await getUserFromToken(req);

    const { data: entreprise, error: entrepriseError } = await findEntreprise(
      ref
    );
    if (entrepriseError) {
      console.error("❌ Erreur fetch entreprise:", entrepriseError.message);
      return res.status(500).json({ error: entrepriseError.message });
    }
    if (!entreprise) {
      return res.status(404).json({ error: "Entreprise non trouvée" });
    }

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

      if (from && typeof from === "string") {
        query = query.gte("start", from);
      }
      if (to && typeof to === "string") {
        query = query.lte("end", to);
      }

      const { data, error } = await query;
      if (error) return res.status(500).json({ error: error.message });

      let slots = data ?? [];

      // 🌍 Utilisateur externe → masquer slots de missions pas encore validées
      if (!canAccessSensitive(user, entreprise)) {
        slots = slots.filter(
          (s: any) =>
            !s.mission_id || // slots libres toujours visibles
            ["validated", "paid", "completed"].includes(s.missions?.status)
        );
      } else {
        // 👤 Entreprise → flag les slots de missions encore proposées/refusées
        slots = slots.map((s: any) => {
          if (
            s.mission_id &&
            ["proposed", "refused"].includes(s.missions?.status)
          ) {
            return { ...s, status_slot: "pending" }; // utile pour affichage gris côté frontend
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
        return res.status(403).json({ error: "Accès interdit" });
      }

      const payload = req.body || {};

      // mission_id est facultatif → si fourni, vérifier qu’il appartient à l’entreprise
      let missionId: number | null = null;
      if (payload.mission_id) {
        const { data: mission, error: missionError } = await supabaseAdmin
          .from("missions")
          .select("id, entreprise_id")
          .eq("id", payload.mission_id)
          .single();

        if (
          missionError ||
          !mission ||
          mission.entreprise_id !== entreprise.id
        ) {
          return res.status(400).json({ error: "Mission invalide" });
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
        .single();

      if (error) return res.status(500).json({ error: error.message });

      return res.status(201).json({ slot: data });
    }

    return res.status(405).json({ error: "Méthode non autorisée" });
  } catch (err: any) {
    console.error("❌ Exception handler slots:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
