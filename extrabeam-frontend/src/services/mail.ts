// src/services/mail.ts
// -------------------------------------------------------------
// Service frontend – utilitaire d’envoi direct (debug)
// -------------------------------------------------------------
//
// 📌 Description :
//   - Donne accès à /api/mail/send pour des tests manuels
//   - Les vraies notifications sont déclenchées côté backend
//
// 📍 Endpoints :
//   - POST /api/mail/send
//
// 🔒 Règles d’accès :
//   - Auth requise
//
// ⚠️ Remarques :
//   - Garder pour le debug, pas pour la notif métier
//
// -------------------------------------------------------------

import { request } from "./api";

export async function sendMail(to: string, subject: string, html: string) {
  return request("/api/mail/send", {
    method: "POST",
    body: JSON.stringify({ to, subject, html }),
  });
}
