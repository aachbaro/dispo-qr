// api/entreprises/[ref]/cv/index.ts
// -------------------------------------------------------------
// CV Agrégé : profile + skills + experiences + education
// -------------------------------------------------------------
//
// 📌 Description :
//   - GET /api/entreprises/[ref]/cv → renvoie tout le CV public
//
// 🔒 Règles d’accès :
//   - Public (lecture seule)
//
// ⚠️ Remarques :
//   - [ref] = slug ou id d’entreprise
//   - Pensé pour 1 appel côté UI
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../../_supabase.js";
import type { Tables } from "../../../../types/database.js";
import { findEntreprise } from "../../../_lib/entreprise.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { ref } = req.query;

  if (!ref || Array.isArray(ref)) {
    return res.status(400).json({ error: "❌ Invalid entreprise ref" });
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "❌ Method not allowed" });
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

    const [profileResp, skillsResp, experiencesResp, educationResp] = await Promise.all([
      supabaseAdmin
        .from("cv_profiles")
        .select("*")
        .eq("entreprise_id", entreprise.id)
        .maybeSingle<Tables<"cv_profiles">>(),
      supabaseAdmin
        .from("cv_skills")
        .select("*")
        .eq("entreprise_id", entreprise.id)
        .order("id", { ascending: true })
        .returns<Tables<"cv_skills">[]>(),
      supabaseAdmin
        .from("cv_experiences")
        .select("*")
        .eq("entreprise_id", entreprise.id)
        .order("start_date", { ascending: false })
        .returns<Tables<"cv_experiences">[]>(),
      supabaseAdmin
        .from("cv_education")
        .select("*")
        .eq("entreprise_id", entreprise.id)
        .order("year", { ascending: false })
        .returns<Tables<"cv_education">[]>(),
    ]);

    if (profileResp.error)
      return res.status(500).json({ error: profileResp.error.message });
    if (skillsResp.error)
      return res.status(500).json({ error: skillsResp.error.message });
    if (experiencesResp.error)
      return res.status(500).json({ error: experiencesResp.error.message });
    if (educationResp.error)
      return res.status(500).json({ error: educationResp.error.message });

    return res.status(200).json({
      entreprise,
      profile: profileResp.data ?? null,
      skills: skillsResp.data ?? [],
      experiences: experiencesResp.data ?? [],
      education: educationResp.data ?? [],
    });
  } catch (err: any) {
    console.error("💥 /api/entreprises/[ref]/cv:", err);
    return res.status(500).json({ error: err?.message ?? "Server error" });
  }
}
