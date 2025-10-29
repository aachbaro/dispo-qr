// api/_lib/mailer.ts
// -------------------------------------------------------------
// Mailer Brevo (bas niveau) – client unique + envoi brut
// -------------------------------------------------------------
//
// 📌 Description :
//   - Initialise le client HTTP Brevo (Sendinblue) avec API Key
//   - Expose sendRawEmail() pour envoyer un HTML/subject/to
//
// 📍 Endpoints (si fichier API) :
//   - (aucun) – lib interne
//
// 🔒 Règles d’accès :
//   - Utilisé seulement côté API routes (server-side)
//   - Lit process.env.BREVO_API_KEY
//
// ⚠️ Remarques :
//   - Centraliser ici l’expéditeur par défaut (no-reply@extrabeam.app)
//   - Prévoir un flag DRY_RUN pour dev si besoin
//
// -------------------------------------------------------------

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const API_KEY = process.env.BREVO_API_KEY;

if (!API_KEY) {
  console.warn("⚠️ BREVO_API_KEY manquante. Les emails échoueront.");
}

export type SendRawEmailParams = {
  to: string;
  subject: string;
  html: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
};

export async function sendRawEmail({
  to,
  subject,
  html,
  fromName = "ExtraBeam",
  fromEmail = "adam.achbarou@gmail.com",
  replyTo,
}: SendRawEmailParams) {
  if (!API_KEY) {
    throw new Error("BREVO_API_KEY absente : impossible d'envoyer un e-mail.");
  }

  const payload = {
    sender: { name: fromName, email: fromEmail },
    to: [{ email: to }],
    subject,
    htmlContent: html,
    ...(replyTo ? { replyTo: { email: replyTo } } : {}),
  };

  const fetchFn = (globalThis as any).fetch as
    | (typeof fetch)
    | undefined;

  if (typeof fetchFn !== "function") {
    throw new Error("Fetch API indisponible dans l'environnement d'exécution");
  }

  const res = await fetchFn(BREVO_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": API_KEY,
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("❌ Brevo error:", json);
    throw new Error(`Échec envoi email: ${res.status} ${res.statusText}`);
  }
  return json;
}
