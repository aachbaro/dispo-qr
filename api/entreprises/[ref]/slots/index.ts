// api/entreprises/[ref]/slots/index.ts
// -------------------------------------------------------------
// Route slots entreprise : /api/entreprises/[ref]/slots
//
// - GET : Lister les slots d’une entreprise
//   • Accessible en public (via slug ou id)
//   • Retourne les créneaux de disponibilité de l’entreprise
//
// - POST : Créer un slot
//   • Réservé à l’owner de l’entreprise ou un admin
//
// ⚠️ Vérifie le token JWT pour l’accès sensible
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../../_supabase.js";

// ----------------------
// Helpers
// ----------------------

/**
 * ✅ Vérifie le token et récupère le user_id
 */
async function getUserFromToken(req: VercelRequest) {
  const auth = req.headers.authorization;
  if (!auth) return null;

  const token = auth.split(" ")[1];
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return null;

  return data.user;
}

/**
 * 🛡️ Vérifie si le user est owner de l’entreprise ou admin
 */
function canAccessSensitive(user: any, entreprise: any): boolean {
  if (!user) return false;
  if (user.id === entreprise.user_id) return true;
  if (user.app_metadata?.role === "admin") return true;
  return false;
}

/**
 * 🔍 Récupère entreprise par id (numérique) ou slug
 */
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
    // ✅ Vérifie user connecté
    const user = await getUserFromToken(req);

    // 🔍 Récupère l’entreprise
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
      const { from, to } = req.query;

      let query = supabaseAdmin
        .from("slots")
        .select("*")
        .eq("entreprise_id", entreprise.id)
        .order("start", { ascending: true });

      if (from && typeof from === "string") {
        query = query.gte("start", from);
      }
      if (to && typeof to === "string") {
        query = query.lte("end", to);
      }

      const { data, error } = await query;
      if (error) return res.status(500).json({ error: error.message });

      return res.status(200).json({ slots: data ?? [] });
    }

    // ----------------------
    // POST → Créer slot
    // ----------------------
    if (req.method === "POST") {
      if (!canAccessSensitive(user, entreprise)) {
        return res.status(403).json({ error: "Accès interdit" });
      }

      const payload = req.body;

      const { data, error } = await supabaseAdmin
        .from("slots")
        .insert({
          ...payload,
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
