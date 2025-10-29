// api/mail/send.ts
// -------------------------------------------------------------
// Envoi direct d’un e-mail (outil de test / utilitaire)
// -------------------------------------------------------------
//
// 📌 Description :
//   - Permet d’envoyer un e-mail arbitraire (to/subject/html)
//   - Utile pour tester l’intégration Brevo en dev
//
// 📍 Endpoints :
//   - POST /api/mail/send → { to, subject, html }
//
// 🔒 Règles d’accès :
//   - Auth requise
//   - A restreindre/retirer en prod si non utilisé
//
// ⚠️ Remarques :
//   - Utilise sendRawEmail() (pas de templates)
// -------------------------------------------------------------

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getUserFromToken } from "../utils/auth.js";
import { sendRawEmail } from "../_lib/mailer.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

  const user = await getUserFromToken(req).catch(() => null);
  if (!user) return res.status(401).json({ error: "Non authentifié" });

  try {
    const { to, subject, html } = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    if (!to || !subject || !html) return res.status(400).json({ error: "Champs manquants" });

    const result = await sendRawEmail({ to, subject, html });
    return res.status(200).json({ message: "✅ Mail envoyé", result });
  } catch (e: any) {
    console.error("❌ /api/mail/send:", e);
    return res.status(500).json({ error: e.message ?? "Erreur serveur" });
  }
}
