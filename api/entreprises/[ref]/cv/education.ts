// api/entreprises/[ref]/cv/education.ts
// -------------------------------------------------------------
// CV Education (lecture publique + gestion propriétaire)
// -------------------------------------------------------------
//
// 📌 Description :
//   - GET  /api/entreprises/[ref]/cv/education
//   - POST /api/entreprises/[ref]/cv/education
//
// 🔒 Règles d’accès :
//   - GET : public
//   - POST : auth + canAccessSensitive(owner/admin)
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../../_supabase.js";
import type { Tables, TablesInsert } from "../../../../types/database.js";
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
        .from("cv_education")
        .select("*")
        .eq("entreprise_id", entreprise.id)
        .order("year", { ascending: false })
        .returns<Tables<"cv_education">[]>();

      if (error) return res.status(500).json({ error: error.message });

      return res.status(200).json({ education: data ?? [] });
    }

    if (req.method === "POST") {
      const user = await getUserFromToken(req);
      if (!user) return res.status(401).json({ error: "❌ Not authenticated" });
      if (!canAccessSensitive(user, entreprise)) {
        return res.status(403).json({ error: "❌ Forbidden" });
      }

      const body =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

      const toInsert: TablesInsert<"cv_education"> = {
        entreprise_id: entreprise.id,
        title: body.title,
        school: body.school ?? null,
        year: body.year ?? null,
      };

      if (!toInsert.title) {
        return res.status(400).json({ error: "❌ title is required" });
      }

      const { error } = await supabaseAdmin.from("cv_education").insert(toInsert);
      if (error) return res.status(500).json({ error: error.message });

      const { data, error: fetchErr } = await supabaseAdmin
        .from("cv_education")
        .select("*")
        .eq("entreprise_id", entreprise.id)
        .order("year", { ascending: false })
        .returns<Tables<"cv_education">[]>();

      if (fetchErr) {
        return res.status(500).json({ error: fetchErr.message });
      }

      return res.status(201).json({ education: data ?? [] });
    }

    return res.status(405).json({ error: "❌ Method not allowed" });
  } catch (err: any) {
    console.error("💥 /api/entreprises/[ref]/cv/education:", err);
    return res.status(500).json({ error: err?.message ?? "Server error" });
  }
}
