// api/_lib/notifications.ts
// -------------------------------------------------------------
// Notifications métier (e-mails) – façade haut niveau
// -------------------------------------------------------------
//
// 📌 Description :
//   - Expose des fonctions "notify.*" par cas d’usage
//   - Construit les sujets + HTML via templates
//   - Envoie via mailer.sendRawEmail()
//   - Gère les variantes destinataires (Entreprise / Client / Visiteur)
//
// 📍 Endpoints :
//   - (aucun) – lib interne utilisée par les routes API
//
// 🔒 Règles d’accès :
//   - Appelée uniquement server-side (endpoints sécurisés)
//
// ⚠️ Remarques :
//   - Prévoir une stratégie d’idempotence si déclenchée dans des webhooks
//   - Ajouter du logging applicatif si besoin
//
// -------------------------------------------------------------

import { sendRawEmail } from "./mailer.js";
import {
  templates,
  type MissionDTO,
  type EntrepriseDTO,
  type ClientDTO,
  type FactureDTO,
} from "./templates/emailTemplates.js";

type Maybe<T> = T | null | undefined;

export const notify = {
  // ENTREPRISE
  async missionCreatedByClient(
    entreprise: EntrepriseDTO & { email?: string | null },
    mission: MissionDTO,
    client: ClientDTO
  ) {
    const to = entreprise.email;
    if (!to) return;
    const { subject, html } = templates.missionCreatedByClient(entreprise, mission, client);
    await sendRawEmail({ to, subject, html, replyTo: client.email ?? undefined });
  },

  async missionCreatedByVisitor(
    entreprise: EntrepriseDTO & { email?: string | null },
    mission: MissionDTO
  ) {
    const to = entreprise.email;
    if (!to) return;
    const { subject, html } = templates.missionCreatedByVisitor(entreprise, mission);
    await sendRawEmail({ to, subject, html, replyTo: mission.contact_email ?? undefined });
  },

  async companyBookmarked(
    entreprise: EntrepriseDTO & { email?: string | null },
    client: ClientDTO
  ) {
    if (!entreprise.email) return;
    const { subject, html } = templates.companyBookmarked(entreprise, client);
    await sendRawEmail({ to: entreprise.email, subject, html });
  },

  async billingStatusChangedForEntreprise(
    entreprise: EntrepriseDTO & { email?: string | null },
    facture: FactureDTO
  ) {
    if (!entreprise.email) return;
    const { subject, html } = templates.billingStatusChangedForEntreprise(entreprise, facture);
    await sendRawEmail({ to: entreprise.email, subject, html });
  },

  // CLIENT / VISITEUR
  async missionAckToClient(
    client: ClientDTO & { email?: string | null },
    mission: MissionDTO,
    entreprise: EntrepriseDTO
  ) {
    if (!client.email) return;
    const { subject, html } = templates.missionAckToClient(client, mission, entreprise);
    await sendRawEmail({ to: client.email, subject, html, replyTo: entreprise.email ?? undefined });
  },

  async missionStatusChangedToClient(
    clientEmail: Maybe<string>,
    mission: MissionDTO,
    entreprise: EntrepriseDTO
  ) {
    if (!clientEmail) return;
    const { subject, html } = templates.missionStatusChangedToClient(clientEmail, mission, entreprise);
    await sendRawEmail({ to: clientEmail, subject, html });
  },

  async missionSlotsRescheduledToClient(
    clientEmail: Maybe<string>,
    mission: MissionDTO,
    entreprise: EntrepriseDTO
  ) {
    if (!clientEmail) return;
    const { subject, html } = templates.missionSlotsRescheduledToClient(clientEmail, mission, entreprise);
    await sendRawEmail({ to: clientEmail, subject, html });
  },

  async invoiceCreatedToClient(
    clientEmail: Maybe<string>,
    facture: FactureDTO,
    entreprise: EntrepriseDTO
  ) {
    if (!clientEmail) return;
    const { subject, html } = templates.invoiceCreatedToClient(clientEmail, facture, entreprise);
    await sendRawEmail({ to: clientEmail, subject, html });
  },

  async paymentLinkToClient(
    clientEmail: Maybe<string>,
    facture: FactureDTO,
    entreprise: EntrepriseDTO
  ) {
    if (!clientEmail) return;
    const { subject, html } = templates.paymentLinkToClient(clientEmail, facture, entreprise);
    await sendRawEmail({ to: clientEmail, subject, html });
  },

  async paymentSucceededToClient(
    clientEmail: Maybe<string>,
    facture: FactureDTO,
    entreprise: EntrepriseDTO
  ) {
    if (!clientEmail) return;
    const { subject, html } = templates.paymentSucceededToClient(clientEmail, facture, entreprise);
    await sendRawEmail({ to: clientEmail, subject, html });
  },

  async paymentFailedToClient(
    clientEmail: Maybe<string>,
    facture: FactureDTO,
    entreprise: EntrepriseDTO
  ) {
    if (!clientEmail) return;
    const { subject, html } = templates.paymentFailedToClient(clientEmail, facture, entreprise);
    await sendRawEmail({ to: clientEmail, subject, html });
  },
};
