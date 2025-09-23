// api/entreprises/[ref]/missions/index.ts
// -------------------------------------------------------------
// Route missions entreprise : /api/entreprises/[ref]/missions
//
// - GET : Liste les missions
//   • Si user authentifié + owner/admin → accès complet
//   • Sinon → accès limité (missions publiques uniquement, ex. status validé/terminé)
//
// - POST : Créer une mission
//   • Si user connecté → mission liée à son compte (client_id)
//   • Si user non connecté → mission anonyme (contact infos dans payload)
//
// ⚠️ Vérifie le token JWT pour gérer les droits d’accès en GET
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
  const { ref } = req.query;

  if (!ref || typeof ref !== "string") {
    return res.status(400).json({ error: "Paramètre entreprise invalide" });
  }

  try {
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
    // GET → Liste missions
    // ----------------------
    if (req.method === "GET") {
      let query = supabaseAdmin
        .from("missions")
        .select("*")
        .eq("entreprise_id", entreprise.id)
        .order("created_at", { ascending: false });

      if (!canAccessSensitive(user, entreprise)) {
        query = query.in("status", ["validé", "terminé"]);
      }

      const { data, error } = await query;
      if (error) return res.status(500).json({ error: error.message });

      return res.status(200).json({ missions: data });
    }

    // ----------------------
    // POST → Créer mission
    // ----------------------
    if (req.method === "POST") {
      const payload = req.body;

      // Cas 1 : user connecté → mission liée à son compte
      if (user) {
        const { data, error } = await supabaseAdmin
          .from("missions")
          .insert({
            ...payload,
            entreprise_id: entreprise.id,
            client_id: user.id, // lié au compte client
          })
          .select()
          .single();

        if (error) return res.status(500).json({ error: error.message });
        return res.status(201).json({ mission: data });
      }

      // Cas 2 : user non connecté → mission "anonyme"
      const { data, error } = await supabaseAdmin
        .from("missions")
        .insert({
          ...payload,
          entreprise_id: entreprise.id,
          status: "proposé", // par défaut
        })
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json({ mission: data });
    }

    return res.status(405).json({ error: "Méthode non autorisée" });
  } catch (err: any) {
    console.error("❌ Exception handler missions:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
