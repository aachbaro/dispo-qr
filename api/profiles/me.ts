// api/profiles/me.ts
// -------------------------------------------------------------
// Profil utilisateur connecté
// -------------------------------------------------------------
//
// 📍 Endpoints :
//   - GET /api/profiles/me → récupère profil + email
//   - PUT /api/profiles/me → met à jour le profil
//
// 🔒 Auth obligatoire (JWT dans Authorization header)
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../_supabase.js";
import type { Tables } from "../../types/database.js";

type Profile = Tables<"profiles">;

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

// ----------------------
// Handler
// ----------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = await getUserFromToken(req);
    if (!user) {
      return res.status(401).json({ error: "❌ Non authentifié" });
    }

    // ----------------------
    // GET → Lire profil
    // ----------------------
    if (req.method === "GET") {
      const { data: profile, error } = await supabaseAdmin
        .from("profiles")
        .select("id, role, created_at")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("❌ Erreur fetch profil:", error.message);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({
        profile: {
          id: user.id,
          email: user.email,
          role: profile?.role ?? null,
          created_at: profile?.created_at ?? null,
        },
      });
    }

    // ----------------------
    // PUT → Update profil
    // ----------------------
    if (req.method === "PUT") {
      const { role } = req.body || {};

      // 🚨 whitelist : on n’autorise que certains champs
      const updates: Partial<Profile> = {};
      if (role) updates.role = role;

      const { data, error } = await supabaseAdmin
        .from("profiles")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single();

      if (error) {
        console.error("❌ Erreur update profil:", error.message);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ profile: data });
    }

    return res.status(405).json({ error: "Méthode non autorisée" });
  } catch (err: any) {
    console.error("❌ Exception profil/me:", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
}
