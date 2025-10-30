// src/notifications/notifications.service.ts
// -------------------------------------------------------------
// Service : Notifications (mail)
// -------------------------------------------------------------
//
// 📌 Description :
//   - Orchestration des notifications e-mail métier (missions, factures)
//   - S'appuie sur le `NotificationsService` du module Mailer pour composer/envoyer
//
// -------------------------------------------------------------

import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';

import type { AuthUser } from '../common/auth/auth.types';
import { AccessService } from '../common/auth/access.service';
import { SupabaseService } from '../common/supabase/supabase.service';
import type { Tables } from '../common/types/database';
import type { FactureWithRelations } from '../factures/factures.service';
import { NotificationsService as MailerNotificationsService } from '../common/mailer/notifications.service';
import type {
  ClientDTO,
  EntrepriseDTO,
  FactureDTO,
  MissionDTO,
} from '../common/mailer/email-templates.service';

const MISSION_SELECT = '*, slots(*), entreprise:entreprise_id(*), client:client_id(*)';
const FACTURE_SELECT = '*, missions(*, slots(*), entreprise:entreprise_id(*), client:client_id(*))';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly accessService: AccessService,
    private readonly mailerNotifications: MailerNotificationsService,
  ) {}

  private toEntrepriseDTO(entreprise: Tables<'entreprise'> | null): EntrepriseDTO {
    return {
      id: entreprise?.id ?? 0,
      nom: entreprise?.nom ?? null,
      prenom: entreprise?.prenom ?? null,
      email: entreprise?.email ?? null,
      telephone: entreprise?.telephone ?? null,
      slug: entreprise?.slug ?? null,
    };
  }

  private toMissionDTO(mission: Tables<'missions'> & { slots?: Tables<'slots'>[] | null }): MissionDTO {
    return {
      id: mission.id,
      etablissement: mission.etablissement ?? null,
      instructions: mission.instructions ?? null,
      mode: mission.mode ?? null,
      status: mission.status ?? 'proposed',
      contact_name: mission.contact_name ?? null,
      contact_email: mission.contact_email ?? null,
      contact_phone: mission.contact_phone ?? null,
      slots: (mission.slots ?? []).map((slot) => ({
        start: slot.start!,
        end: slot.end!,
        title: slot.title ?? null,
      })),
    };
  }

  private toClientDTO(client: Tables<'profiles'> | null): ClientDTO {
    if (!client) {
      return { id: null, name: null, email: null };
    }
    return {
      id: client.id ?? null,
      name: `${client.first_name ?? ''} ${client.last_name ?? ''}`.trim() || null,
      email: client.email ?? null,
    };
  }

  private toFactureDTO(facture: FactureWithRelations): FactureDTO {
    return {
      id: facture.id,
      numero: facture.numero,
      montant_ht: facture.montant_ht ?? null,
      montant_ttc: facture.montant_ttc ?? null,
      status: (facture.status ?? 'pending_payment') as FactureDTO['status'],
      payment_link: facture.payment_link ?? null,
    };
  }

  async notifyFactureCreated(facture: FactureWithRelations, entreprise: Tables<'entreprise'>) {
    const entrepriseDto = this.toEntrepriseDTO(entreprise);
    const factureDto = this.toFactureDTO(facture);

    await this.mailerNotifications.billingStatusChangedForEntreprise(entrepriseDto, factureDto);

    const client = facture.missions?.client ?? null;
    const clientDto: ClientDTO = {
      id: client?.id ?? facture.missions?.client_id ?? null,
      name: client ? `${client.first_name ?? ''} ${client.last_name ?? ''}`.trim() || null : null,
      email: client?.email ?? facture.contact_email ?? null,
    };

    const enrichedFacture = {
      ...factureDto,
      payment_link: facture.payment_link ?? null,
    } as FactureDTO;

    await this.mailerNotifications.invoiceCreatedToClient({
      ...facture,
      ...enrichedFacture,
    } as any, entrepriseDto);
  }

  async sendFactureNotification(id: number, user: AuthUser | null): Promise<{ sent: true }> {
    if (!user) {
      throw new ForbiddenException('Authentification requise');
    }

    const admin = this.supabase.getAdminClient();
    const { data, error } = await admin
      .from('factures')
      .select(FACTURE_SELECT)
      .eq('id', id)
      .maybeSingle<FactureWithRelations>();

    if (error || !data) {
      throw new NotFoundException('Facture introuvable');
    }

    const entreprise = data.missions?.entreprise ?? (await this.accessService.findEntreprise(String(data.entreprise_id)));
    if (!this.accessService.canAccessEntreprise(user, entreprise)) {
      throw new ForbiddenException('Accès interdit');
    }

    await this.notifyFactureCreated(data, entreprise);
    if (data.payment_link) {
      await this.mailerNotifications.paymentLinkToClient(data as any, this.toEntrepriseDTO(entreprise));
    }

    return { sent: true };
  }

  async sendMissionNotification(id: number, user: AuthUser | null): Promise<{ sent: true }> {
    if (!user) {
      throw new ForbiddenException('Authentification requise');
    }

    const admin = this.supabase.getAdminClient();
    const { data, error } = await admin
      .from('missions')
      .select(MISSION_SELECT)
      .eq('id', id)
      .maybeSingle<Tables<'missions'> & { slots?: Tables<'slots'>[]; entreprise?: Tables<'entreprise'> | null; client?: Tables<'profiles'> | null }>();

    if (error || !data) {
      throw new NotFoundException('Mission introuvable');
    }

    const entreprise = data.entreprise ?? (data.entreprise_id ? await this.accessService.findEntreprise(String(data.entreprise_id)) : null);
    if (!entreprise || !this.accessService.canAccessEntreprise(user, entreprise)) {
      throw new ForbiddenException('Accès interdit');
    }

    const entrepriseDto = this.toEntrepriseDTO(entreprise);
    const missionDto = this.toMissionDTO({ ...data, slots: data.slots ?? [] });
    const clientDto = this.toClientDTO(data.client ?? null);

    await this.mailerNotifications.missionStatusChangedToClient(
      { ...missionDto, client_id: data.client_id ?? null } as any,
      entrepriseDto,
    );
    await this.mailerNotifications.missionAckToClient(clientDto, missionDto, entrepriseDto);

    return { sent: true };
  }
}
