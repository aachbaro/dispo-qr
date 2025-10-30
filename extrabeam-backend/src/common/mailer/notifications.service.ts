import { Injectable, Logger } from '@nestjs/common';

import { getClientEmailFromFacture, getClientEmailFromMission } from '../utils/email.util';
import { EmailTemplatesService, type ClientDTO, type EntrepriseDTO, type FactureDTO, type MissionDTO } from './email-templates.service';
import { MailerService } from './mailer.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly mailer: MailerService,
    private readonly templates: EmailTemplatesService,
  ) {}

  async missionCreatedByClient(
    entreprise: EntrepriseDTO & { email?: string | null },
    mission: MissionDTO,
    client: ClientDTO,
  ) {
    const to = entreprise.email;
    if (!to) {
      return;
    }
    const { subject, html } = this.templates.missionCreatedByClient(entreprise, mission, client);
    await this.mailer.sendRawEmail({ to, subject, html, replyTo: client.email ?? undefined });
  }

  async missionCreatedByVisitor(
    entreprise: EntrepriseDTO & { email?: string | null },
    mission: MissionDTO,
  ) {
    const to = entreprise.email;
    if (!to) {
      return;
    }
    const { subject, html } = this.templates.missionCreatedByVisitor(entreprise, mission);
    await this.mailer.sendRawEmail({
      to,
      subject,
      html,
      replyTo: mission.contact_email ?? undefined,
    });
  }

  async companyBookmarked(
    entreprise: EntrepriseDTO & { email?: string | null },
    client: ClientDTO,
  ) {
    if (!entreprise.email) {
      return;
    }
    const { subject, html } = this.templates.companyBookmarked(entreprise, client);
    await this.mailer.sendRawEmail({ to: entreprise.email, subject, html });
  }

  async billingStatusChangedForEntreprise(
    entreprise: EntrepriseDTO & { email?: string | null },
    facture: FactureDTO,
  ) {
    if (!entreprise.email) {
      return;
    }
    const { subject, html } = this.templates.billingStatusChangedForEntreprise(entreprise, facture);
    await this.mailer.sendRawEmail({ to: entreprise.email, subject, html });
  }

  async missionAckToClient(
    client: ClientDTO & { email?: string | null },
    mission: MissionDTO,
    entreprise: EntrepriseDTO,
  ) {
    if (!client.email) {
      return;
    }
    const { subject, html } = this.templates.missionAckToClient(client, mission, entreprise);
    await this.mailer.sendRawEmail({
      to: client.email,
      subject,
      html,
      replyTo: entreprise.email ?? undefined,
    });
  }

  async missionStatusChangedToClient(
    mission: MissionDTO & { client?: any; client_id?: string | null },
    entreprise: EntrepriseDTO,
  ) {
    const clientEmail = getClientEmailFromMission(mission as any);
    if (!clientEmail) {
      this.logger.log('📭 Aucun e-mail disponible pour cette mission', {
        mission_id: mission.id,
        client_id: mission.client_id ?? null,
      });
      return;
    }
    const { subject, html } = this.templates.missionStatusChangedToClient(clientEmail, mission, entreprise);
    await this.mailer.sendRawEmail({ to: clientEmail, subject, html });
  }

  async missionSlotsRescheduledToClient(
    mission: MissionDTO & { client?: any; client_id?: string | null },
    entreprise: EntrepriseDTO,
  ) {
    const clientEmail = getClientEmailFromMission(mission as any);
    if (!clientEmail) {
      this.logger.log('📭 Aucun e-mail disponible pour cette mission', {
        mission_id: mission.id,
        client_id: mission.client_id ?? null,
      });
      return;
    }
    const { subject, html } = this.templates.missionSlotsRescheduledToClient(clientEmail, mission, entreprise);
    await this.mailer.sendRawEmail({ to: clientEmail, subject, html });
  }

  private sanitizeFacture(facture: FactureDTO) {
    return {
      id: facture.id,
      numero: facture.numero,
      montant_ht: facture.montant_ht ?? null,
      montant_ttc: facture.montant_ttc ?? null,
      status: facture.status,
      payment_link: facture.payment_link ?? null,
    } satisfies FactureDTO;
  }

  async invoiceCreatedToClient(
    facture: FactureDTO & {
      missions?: { client?: any; contact_email?: string | null; client_id?: string | null } | null;
      contact_email?: string | null;
      mission_id?: number | null;
    },
    entreprise: EntrepriseDTO,
  ) {
    const clientEmail = getClientEmailFromFacture(facture as any);
    if (!clientEmail) {
      this.logger.log('📭 Aucun e-mail disponible pour cette facture', {
        facture_id: facture.id,
        mission_id: facture.mission_id ?? null,
      });
      return;
    }
    const factureDto = this.sanitizeFacture(facture);
    const { subject, html } = this.templates.invoiceCreatedToClient(clientEmail, factureDto, entreprise);
    await this.mailer.sendRawEmail({ to: clientEmail, subject, html });
  }

  async paymentLinkToClient(
    facture: FactureDTO & {
      missions?: { client?: any; contact_email?: string | null; client_id?: string | null } | null;
      contact_email?: string | null;
      mission_id?: number | null;
    },
    entreprise: EntrepriseDTO,
  ) {
    const clientEmail = getClientEmailFromFacture(facture as any);
    if (!clientEmail) {
      this.logger.log('📭 Aucun e-mail disponible pour cette facture', {
        facture_id: facture.id,
        mission_id: facture.mission_id ?? null,
      });
      return;
    }
    const factureDto = this.sanitizeFacture(facture);
    const { subject, html } = this.templates.paymentLinkToClient(clientEmail, factureDto, entreprise);
    await this.mailer.sendRawEmail({ to: clientEmail, subject, html });
  }

  async paymentSucceededToClient(
    facture: FactureDTO & {
      missions?: { client?: any; contact_email?: string | null; client_id?: string | null } | null;
      contact_email?: string | null;
      mission_id?: number | null;
    },
    entreprise: EntrepriseDTO,
  ) {
    const clientEmail = getClientEmailFromFacture(facture as any);
    if (!clientEmail) {
      this.logger.log('📭 Aucun e-mail disponible pour cette facture', {
        facture_id: facture.id,
        mission_id: facture.mission_id ?? null,
      });
      return;
    }
    const factureDto = this.sanitizeFacture(facture);
    const { subject, html } = this.templates.paymentSucceededToClient(clientEmail, factureDto, entreprise);
    await this.mailer.sendRawEmail({ to: clientEmail, subject, html });
  }

  async paymentFailedToClient(
    facture: FactureDTO & {
      missions?: { client?: any; contact_email?: string | null; client_id?: string | null } | null;
      contact_email?: string | null;
      mission_id?: number | null;
    },
    entreprise: EntrepriseDTO,
  ) {
    const clientEmail = getClientEmailFromFacture(facture as any);
    if (!clientEmail) {
      this.logger.log('📭 Aucun e-mail disponible pour cette facture', {
        facture_id: facture.id,
        mission_id: facture.mission_id ?? null,
      });
      return;
    }
    const factureDto = this.sanitizeFacture(facture);
    const { subject, html } = this.templates.paymentFailedToClient(clientEmail, factureDto, entreprise);
    await this.mailer.sendRawEmail({ to: clientEmail, subject, html });
  }
}
