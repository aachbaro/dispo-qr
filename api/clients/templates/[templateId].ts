// api/clients/templates/[templateId].ts
// -------------------------------------------------------------
// Gestion d’un modèle de mission spécifique
// -------------------------------------------------------------
//
// 📌 Description :
//   - PUT    → Met à jour un template existant
//   - DELETE → Supprime un template
//
// 🔒 Règles d’accès :
//   - Seul le client authentifié avec son propre id peut modifier/supprimer
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../_supabase.js";
import { getUserFromToken } from "../../utils/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id, templateId } = req.query;
  if (
    !id ||
    typeof id !== "string" ||
    !templateId ||
    typeof templateId !== "string"
  ) {
    return res.status(400).json({ error: "❌ Client id et templateId requis" });
  }

  // Vérifier auth
  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ error: "Non authentifié" });
  if (user.id !== id) {
    return res.status(403).json({ error: "Accès interdit" });
  }

  if (req.method === "PUT") {
    const updates = req.body;
    const { data, error } = await supabaseAdmin
      .from("mission_templates")
      .update(updates)
      .eq("id", templateId)
      .eq("client_id", id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ template: data });
  }

  if (req.method === "DELETE") {
    const { error } = await supabaseAdmin
      .from("mission_templates")
      .delete()
      .eq("id", templateId)
      .eq("client_id", id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Méthode non autorisée" });
}
