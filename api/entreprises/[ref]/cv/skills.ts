// api/entreprises/[ref]/cv/skills.ts
// -------------------------------------------------------------
// CV Skills (lecture publique + ajout propriétaire)
// -------------------------------------------------------------
//
// 📌 Description :
//   - GET  /api/entreprises/[ref]/cv/skills → liste des skills (public)
//   - POST /api/entreprises/[ref]/cv/skills → ajouter des skills (owner/admin)
//
// 🔒 Règles d’accès :
//   - GET : public
//   - POST : auth + canAccessSensitive(owner/admin)
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../../../_supabase.js";
import type { Tables, TablesInsert } from "../../../../../types/database.js";
import { getUserFromToken } from "../../../../utils/auth.js";
import { canAccessSensitive, findEntreprise } from "../../../../_lib/entreprise.js";

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
        .from("cv_skills")
        .select("*")
        .eq("entreprise_id", entreprise.id)
        .order("id", { ascending: true })
        .returns<Tables<"cv_skills">[]>();

      if (error) return res.status(500).json({ error: error.message });

      return res.status(200).json({ skills: data ?? [] });
    }

    if (req.method === "POST") {
      const user = await getUserFromToken(req);
      if (!user) return res.status(401).json({ error: "❌ Not authenticated" });
      if (!canAccessSensitive(user, entreprise)) {
        return res.status(403).json({ error: "❌ Forbidden" });
      }

      const body =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

      const names: string[] = Array.isArray(body?.names)
        ? body.names
        : body?.name
        ? [body.name]
        : [];

      const clean = [...new Set(names.map((name) => String(name).trim()).filter(Boolean))];
      if (clean.length === 0) {
        return res.status(400).json({ error: "❌ Provide 'name' or 'names[]'" });
      }

      const toInsert: TablesInsert<"cv_skills">[] = clean.map((name) => ({
        entreprise_id: entreprise.id,
        name,
      }));

      const { error: insertErr } = await supabaseAdmin
        .from("cv_skills")
        .insert(toInsert);

      if (insertErr) {
        return res.status(500).json({ error: insertErr.message });
      }

      const { data, error } = await supabaseAdmin
        .from("cv_skills")
        .select("*")
        .eq("entreprise_id", entreprise.id)
        .order("id", { ascending: true })
        .returns<Tables<"cv_skills">[]>();

      if (error) return res.status(500).json({ error: error.message });

      return res.status(201).json({ skills: data ?? [] });
    }

    return res.status(405).json({ error: "❌ Method not allowed" });
  } catch (err: any) {
    console.error("💥 /api/entreprises/[ref]/cv/skills:", err);
    return res.status(500).json({ error: err?.message ?? "Server error" });
  }
}
