// api/entreprises/[ref]/cv/profile.ts
// -------------------------------------------------------------
// CV Profile (lecture publique + mise à jour propriétaire)
// -------------------------------------------------------------
//
// 📌 Description :
//   - GET  /api/entreprises/[ref]/cv/profile → lire le profil CV public
//   - PUT  /api/entreprises/[ref]/cv/profile → créer/mettre à jour (owner/admin)
//
// 🔒 Règles d’accès :
//   - GET : public
//   - PUT : auth + canAccessSensitive(owner/admin)
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../../_supabase.js";
import type { Tables, TablesInsert, TablesUpdate } from "../../../../types/database.js";
import { getUserFromToken } from "../../../utils/auth.js";
import { canAccessSensitive, findEntreprise } from "../../../_lib/entreprise.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { ref } = req.query;

  if (!ref || Array.isArray(ref)) {
    return res.status(400).json({ error: "❌ Invalid entreprise ref" });
  }

  try {
    const { data: entreprise, error: findErr } = await findEntreprise(ref);
    if (findErr) {
      console.error("❌ Error fetching entreprise:", findErr.message);
      return res.status(500).json({ error: findErr.message });
    }

    if (!entreprise) {
      return res.status(404).json({ error: "❌ Entreprise not found" });
    }

    if (req.method === "GET") {
      const { data, error } = await supabaseAdmin
        .from("cv_profiles")
        .select("*")
        .eq("entreprise_id", entreprise.id)
        .maybeSingle<Tables<"cv_profiles">>();

      if (error) return res.status(500).json({ error: error.message });

      return res.status(200).json({ profile: data ?? null });
    }

    if (req.method === "PUT") {
      const user = await getUserFromToken(req);
      if (!user) return res.status(401).json({ error: "❌ Not authenticated" });
      if (!canAccessSensitive(user, entreprise)) {
        return res.status(403).json({ error: "❌ Forbidden" });
      }

      const payload =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

      const { data: existing } = await supabaseAdmin
        .from("cv_profiles")
        .select("id")
        .eq("entreprise_id", entreprise.id)
        .maybeSingle<{ id: number }>();

      if (existing?.id) {
        const updates: TablesUpdate<"cv_profiles"> = {
          job_title: payload.job_title ?? null,
          location: payload.location ?? null,
          bio: payload.bio ?? null,
          photo_url: payload.photo_url ?? null,
        };

        const { data, error } = await supabaseAdmin
          .from("cv_profiles")
          .update(updates)
          .eq("id", existing.id)
          .select("*")
          .single<Tables<"cv_profiles">>();

        if (error) return res.status(500).json({ error: error.message });

        return res.status(200).json({ profile: data });
      }

      const toInsert: TablesInsert<"cv_profiles"> = {
        entreprise_id: entreprise.id,
        job_title: payload.job_title ?? null,
        location: payload.location ?? null,
        bio: payload.bio ?? null,
        photo_url: payload.photo_url ?? null,
      };

      const { data, error } = await supabaseAdmin
        .from("cv_profiles")
        .insert(toInsert)
        .select("*")
        .single<Tables<"cv_profiles">>();

      if (error) return res.status(500).json({ error: error.message });

      return res.status(201).json({ profile: data });
    }

    return res.status(405).json({ error: "❌ Method not allowed" });
  } catch (err: any) {
    console.error("💥 /api/entreprises/[ref]/cv/profile:", err);
    return res.status(500).json({ error: err?.message ?? "Server error" });
  }
}
