// api/entreprises/[ref]/slots/[id].ts
// -------------------------------------------------------------
// Route slot entreprise : /api/entreprises/[ref]/slots/[id]
//
// - PUT    : Mettre à jour un slot existant
// - DELETE : Supprimer un slot
//
// ⚠️ Accès réservé à l’owner de l’entreprise ou un admin
// ⚠️ ref = id (bigint) ou slug de l’entreprise
// ⚠️ id  = identifiant numérique du slot
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
  const { ref, id } = req.query;

  if (!ref || typeof ref !== "string" || !id || typeof id !== "string") {
    return res.status(400).json({ error: "Paramètres invalides" });
  }

  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: "Non authentifié" });
    }

    // 🔍 Récupère entreprise (id numérique ou slug)
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

    // 🔒 Vérifie droits
    if (!canAccessSensitive(user, entreprise)) {
      return res.status(403).json({ error: "Accès interdit" });
    }

    // Cast slot id en number
    const slotId = Number(id);
    if (isNaN(slotId)) {
      return res.status(400).json({ error: "ID slot invalide" });
    }

    // ----------------------
    // PUT → Modifier slot
    // ----------------------
    if (req.method === "PUT") {
      const updates = req.body;

      const { data, error } = await supabaseAdmin
        .from("slots")
        .update(updates)
        .eq("id", slotId)
        .eq("entreprise_id", entreprise.id)
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      if (!data) return res.status(404).json({ error: "Slot non trouvé" });

      return res.status(200).json({ slot: data });
    }

    // ----------------------
    // DELETE → Supprimer slot
    // ----------------------
    if (req.method === "DELETE") {
      const { error } = await supabaseAdmin
        .from("slots")
        .delete()
        .eq("id", slotId)
        .eq("entreprise_id", entreprise.id);

      if (error) return res.status(500).json({ error: error.message });

      return res.status(200).json({ message: "Slot supprimé" }); // 👈 au lieu de 204
    }

    return res.status(405).json({ error: "Méthode non autorisée" });
  } catch (err: any) {
    console.error("❌ Exception handler slot:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
