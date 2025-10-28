// api/entreprises/[ref]/cv/experiences/[id].ts
// -------------------------------------------------------------
// Update / Delete d’une expérience (owner/admin)
// -------------------------------------------------------------
//
// 📌 Description :
//   - PUT    /api/entreprises/[ref]/cv/experiences/[id]
//   - DELETE /api/entreprises/[ref]/cv/experiences/[id]
//
// 🔒 Règles d’accès :
//   - Auth + canAccessSensitive(owner/admin)
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../../../_supabase.js";
import type { TablesUpdate } from "../../../../../types/database.js";
import { getUserFromToken } from "../../../../utils/auth.js";
import { canAccessSensitive, findEntreprise } from "../../../../_lib/entreprise.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { ref, id } = req.query;

  if (!ref || Array.isArray(ref) || !id || Array.isArray(id)) {
    return res.status(400).json({ error: "❌ Invalid params" });
  }

  const experienceId = Number(id);
  if (Number.isNaN(experienceId)) {
    return res.status(400).json({ error: "❌ Invalid id" });
  }

  try {
    const user = await getUserFromToken(req);
    if (!user) return res.status(401).json({ error: "❌ Not authenticated" });

    const { data: entreprise, error: findErr } = await findEntreprise(ref);
    if (findErr) {
      console.error("❌ Error fetching entreprise:", findErr.message);
      return res.status(500).json({ error: findErr.message });
    }

    if (!entreprise) {
      return res.status(404).json({ error: "❌ Entreprise not found" });
    }

    if (!canAccessSensitive(user, entreprise)) {
      return res.status(403).json({ error: "❌ Forbidden" });
    }

    if (req.method === "PUT") {
      const body =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

      const updates: TablesUpdate<"cv_experiences"> = {
        title: body.title,
        company: body.company ?? null,
        start_date: body.start_date ?? null,
        end_date: body.is_current ? null : body.end_date ?? null,
        description: body.description ?? null,
        is_current: !!body.is_current,
      };

      const { error } = await supabaseAdmin
        .from("cv_experiences")
        .update(updates)
        .eq("id", experienceId)
        .eq("entreprise_id", entreprise.id);

      if (error) return res.status(500).json({ error: error.message });

      return res.status(200).json({ message: "✅ Experience updated" });
    }

    if (req.method === "DELETE") {
      const { error } = await supabaseAdmin
        .from("cv_experiences")
        .delete()
        .eq("id", experienceId)
        .eq("entreprise_id", entreprise.id);

      if (error) return res.status(500).json({ error: error.message });

      return res.status(200).json({ message: "✅ Experience deleted" });
    }

    return res.status(405).json({ error: "❌ Method not allowed" });
  } catch (err: any) {
    console.error("💥 /api/entreprises/[ref]/cv/experiences/[id]:", err);
    return res.status(500).json({ error: err?.message ?? "Server error" });
  }
}
