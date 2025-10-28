// api/entreprises/[ref]/cv/skills/[id].ts
// -------------------------------------------------------------
// Suppression d’un skill (owner/admin)
// -------------------------------------------------------------
//
// 📌 Description :
//   - DELETE /api/entreprises/[ref]/cv/skills/[id]
//
// 🔒 Règles d’accès :
//   - Auth + canAccessSensitive(owner/admin)
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../../../../_supabase.js";
import { getUserFromToken } from "../../../../utils/auth.js";
import { canAccessSensitive, findEntreprise } from "../../../../_lib/entreprise.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { ref, id } = req.query;

  if (!ref || Array.isArray(ref) || !id || Array.isArray(id)) {
    return res.status(400).json({ error: "❌ Invalid params" });
  }

  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "❌ Method not allowed" });
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

    const skillId = Number(id);
    if (Number.isNaN(skillId)) {
      return res.status(400).json({ error: "❌ Invalid skill id" });
    }

    const { error } = await supabaseAdmin
      .from("cv_skills")
      .delete()
      .eq("id", skillId)
      .eq("entreprise_id", entreprise.id);

    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ message: "✅ Skill deleted" });
  } catch (err: any) {
    console.error("💥 /api/entreprises/[ref]/cv/skills/[id]:", err);
    return res.status(500).json({ error: err?.message ?? "Server error" });
  }
}
