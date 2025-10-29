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
import {
  getClientEmailFromFacture,
  getClientEmailFromMission,
} from "./utils/email.js";

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
    mission: MissionDTO & {
      client?: any;
      client_id?: string | null;
    },
    entreprise: EntrepriseDTO
  ) {
    const clientEmail = getClientEmailFromMission(mission as any);
    if (!clientEmail) {
      console.log("📭 Aucun e-mail disponible pour cette mission", {
        mission_id: mission.id,
        client_id: mission.client_id ?? null,
      });
      return;
    }
    const { subject, html } = templates.missionStatusChangedToClient(clientEmail, mission, entreprise);
    await sendRawEmail({ to: clientEmail, subject, html });
  },

  async missionSlotsRescheduledToClient(
    mission: MissionDTO & {
      client?: any;
      client_id?: string | null;
    },
    entreprise: EntrepriseDTO
  ) {
    const clientEmail = getClientEmailFromMission(mission as any);
    if (!clientEmail) {
      console.log("📭 Aucun e-mail disponible pour cette mission", {
        mission_id: mission.id,
        client_id: mission.client_id ?? null,
      });
      return;
    }
    const { subject, html } = templates.missionSlotsRescheduledToClient(clientEmail, mission, entreprise);
    await sendRawEmail({ to: clientEmail, subject, html });
  },

  async invoiceCreatedToClient(
    facture: FactureDTO & {
      missions?: {
        client?: any;
        contact_email?: string | null;
        client_id?: string | null;
      } | null;
      contact_email?: string | null;
      mission_id?: number | null;
    },
    entreprise: EntrepriseDTO
  ) {
    const clientEmail = getClientEmailFromFacture(facture as any);
    if (!clientEmail) {
      console.log("📭 Aucun e-mail disponible pour cette facture", {
        facture_id: facture.id,
        mission_id: facture.mission_id ?? null,
      });
      return;
    }
    const factureDto: FactureDTO = {
      id: facture.id,
      numero: facture.numero,
      montant_ht: facture.montant_ht ?? null,
      montant_ttc: facture.montant_ttc ?? null,
      status: facture.status,
      payment_link: facture.payment_link ?? null,
    };
    const { subject, html } = templates.invoiceCreatedToClient(clientEmail, factureDto, entreprise);
    await sendRawEmail({ to: clientEmail, subject, html });
  },

  async paymentLinkToClient(
    facture: FactureDTO & {
      missions?: {
        client?: any;
        contact_email?: string | null;
        client_id?: string | null;
      } | null;
      contact_email?: string | null;
      mission_id?: number | null;
    },
    entreprise: EntrepriseDTO
  ) {
    const clientEmail = getClientEmailFromFacture(facture as any);
    if (!clientEmail) {
      console.log("📭 Aucun e-mail disponible pour cette facture", {
        facture_id: facture.id,
        mission_id: facture.mission_id ?? null,
      });
      return;
    }
    const factureDto: FactureDTO = {
      id: facture.id,
      numero: facture.numero,
      montant_ht: facture.montant_ht ?? null,
      montant_ttc: facture.montant_ttc ?? null,
      status: facture.status,
      payment_link: facture.payment_link ?? null,
    };
    const { subject, html } = templates.paymentLinkToClient(clientEmail, factureDto, entreprise);
    await sendRawEmail({ to: clientEmail, subject, html });
  },

  async paymentSucceededToClient(
    facture: FactureDTO & {
      missions?: {
        client?: any;
        contact_email?: string | null;
        client_id?: string | null;
      } | null;
      contact_email?: string | null;
      mission_id?: number | null;
    },
    entreprise: EntrepriseDTO
  ) {
    const clientEmail = getClientEmailFromFacture(facture as any);
    if (!clientEmail) {
      console.log("📭 Aucun e-mail disponible pour cette facture", {
        facture_id: facture.id,
        mission_id: facture.mission_id ?? null,
      });
      return;
    }
    const factureDto: FactureDTO = {
      id: facture.id,
      numero: facture.numero,
      montant_ht: facture.montant_ht ?? null,
      montant_ttc: facture.montant_ttc ?? null,
      status: facture.status,
      payment_link: facture.payment_link ?? null,
    };
    const { subject, html } = templates.paymentSucceededToClient(clientEmail, factureDto, entreprise);
    await sendRawEmail({ to: clientEmail, subject, html });
  },

  async paymentFailedToClient(
    facture: FactureDTO & {
      missions?: {
        client?: any;
        contact_email?: string | null;
        client_id?: string | null;
      } | null;
      contact_email?: string | null;
      mission_id?: number | null;
    },
    entreprise: EntrepriseDTO
  ) {
    const clientEmail = getClientEmailFromFacture(facture as any);
    if (!clientEmail) {
      console.log("📭 Aucun e-mail disponible pour cette facture", {
        facture_id: facture.id,
        mission_id: facture.mission_id ?? null,
      });
      return;
    }
    const factureDto: FactureDTO = {
      id: facture.id,
      numero: facture.numero,
      montant_ht: facture.montant_ht ?? null,
      montant_ttc: facture.montant_ttc ?? null,
      status: facture.status,
      payment_link: facture.payment_link ?? null,
    };
    const { subject, html } = templates.paymentFailedToClient(clientEmail, factureDto, entreprise);
    await sendRawEmail({ to: clientEmail, subject, html });
  },
};
