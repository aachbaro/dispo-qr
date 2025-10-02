// api/clients/contacts/[contactId].ts
// -------------------------------------------------------------
// Gestion d’un contact spécifique
// -------------------------------------------------------------
//
// 📌 Description :
//   - DELETE → Supprime un extra de la liste du client
//
// 🔒 Règles d’accès :
//   - Seul le client propriétaire peut supprimer ses contacts
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../_supabase.js";
import { getUserFromToken } from "../../utils/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { contactId } = req.query;
  if (!contactId || typeof contactId !== "string") {
    return res.status(400).json({ error: "❌ contactId requis" });
  }

  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ error: "Non authentifié" });

  if (req.method === "DELETE") {
    const { error } = await supabaseAdmin
      .from("client_contacts")
      .delete()
      .eq("id", contactId)
      .eq("client_id", user.id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Méthode non autorisée" });
}
