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

import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'

import { AccessService } from '../common/auth/access.service'
import { NotificationsService as MailerNotificationsService } from '../common/mailer/notifications.service'
import { SupabaseService } from '../common/supabase/supabase.service'
import type { AuthUser } from '../common/auth/auth.types'
import type {
  ClientDTO,
  EntrepriseDTO,
  FactureDTO,
  MissionDTO,
} from '../common/mailer/email-templates.service'
import type { FactureWithRelations } from '../factures/factures.service'
import type { Table } from '../types/aliases'

type MissionWithRelations = Table<'missions'> & {
  slots?: Table<'slots'>[] | null
  entreprise?: Table<'entreprise'> | null
  client?: Table<'profiles'> | null
}

type FactureMailPayload = FactureDTO & {
  missions?: {
    client?: Table<'profiles'> | null
    contact_email?: string | null
    client_id?: string | null
  } | null
  contact_email?: string | null
  mission_id?: number | null
}

type MissionMailerPayload = MissionDTO & {
  client?: Table<'profiles'> | null
  client_id?: string | null
}

const MISSION_SELECT = '*, slots(*), entreprise:entreprise_id(*), client:client_id(*)'
const FACTURE_SELECT = '*, missions(*, slots(*), entreprise:entreprise_id(*), client:client_id(*))'

@Injectable()
export class NotificationsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly accessService: AccessService,
    private readonly mailerNotifications: MailerNotificationsService,
  ) {}

  private toEntrepriseDTO(entreprise: Table<'entreprise'> | null): EntrepriseDTO {
    return {
      id: entreprise?.id ?? 0,
      nom: entreprise?.nom ?? null,
      prenom: entreprise?.prenom ?? null,
      email: entreprise?.email ?? null,
      telephone: entreprise?.telephone ?? null,
      slug: entreprise?.slug ?? null,
    }
  }

  private toMissionDTO(mission: MissionWithRelations): MissionDTO {
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
        start: slot.start ?? '',
        end: slot.end ?? '',
        title: slot.title ?? null,
      })),
    }
  }

  private toClientDTO(client: Table<'profiles'> | null): ClientDTO {
    if (!client) {
      return { id: null, name: null, email: null }
    }
    const first = client.first_name ?? ''
    const last = client.last_name ?? ''
    const fullName = `${first} ${last}`.trim()
    return {
      id: client.id ?? null,
      name: fullName.length > 0 ? fullName : null,
      email: client.email ?? null,
    }
  }

  private toFactureDTO(facture: FactureWithRelations): FactureDTO {
    return {
      id: facture.id,
      numero: facture.numero,
      montant_ht: facture.montant_ht ?? null,
      montant_ttc: facture.montant_ttc ?? null,
      status: (facture.status ?? 'pending_payment') as FactureDTO['status'],
      payment_link: facture.payment_link ?? null,
    }
  }

  private buildFactureMailPayload(facture: FactureWithRelations): FactureMailPayload {
    return {
      ...this.toFactureDTO(facture),
      payment_link: facture.payment_link ?? null,
      missions: facture.missions
        ? {
            client: facture.missions.client ?? null,
            contact_email: facture.missions.contact_email ?? null,
            client_id: facture.missions.client_id ?? null,
          }
        : null,
      contact_email: facture.contact_email ?? null,
      mission_id: facture.mission_id ?? null,
    }
  }

  async notifyFactureCreated(
    facture: FactureWithRelations,
    entreprise: Table<'entreprise'>,
  ): Promise<void> {
    const entrepriseDto = this.toEntrepriseDTO(entreprise)
    const factureMailPayload = this.buildFactureMailPayload(facture)

    await this.mailerNotifications.billingStatusChangedForEntreprise(
      entrepriseDto,
      factureMailPayload,
    )

    await this.mailerNotifications.invoiceCreatedToClient(
      factureMailPayload,
      entrepriseDto,
    )
  }

  async sendFactureNotification(
    id: number,
    user: AuthUser | null,
  ): Promise<{ sent: true }> {
    if (!user) {
      throw new ForbiddenException('Authentification requise')
    }

    const admin = this.supabase.getAdminClient()
    const { data, error } = await admin
      .from('factures')
      .select(FACTURE_SELECT)
      .eq('id', id)
      .returns<FactureWithRelations[]>()
      .maybeSingle()

    if (error || !data) {
      throw new NotFoundException('Facture introuvable')
    }

    const entreprise =
      data.missions?.entreprise ??
      (await this.accessService.findEntreprise(String(data.entreprise_id)))
    if (!this.accessService.canAccessEntreprise(user, entreprise)) {
      throw new ForbiddenException('Accès interdit')
    }

    const entrepriseDto = this.toEntrepriseDTO(entreprise)
    const factureMailPayload = this.buildFactureMailPayload(data)
    await this.notifyFactureCreated(data, entreprise)

    if (factureMailPayload.payment_link) {
      await this.mailerNotifications.paymentLinkToClient(
        factureMailPayload,
        entrepriseDto,
      )
    }

    return { sent: true }
  }

  async sendMissionNotification(
    id: number,
    user: AuthUser | null,
  ): Promise<{ sent: true }> {
    if (!user) {
      throw new ForbiddenException('Authentification requise')
    }

    const admin = this.supabase.getAdminClient()
    const { data, error } = await admin
      .from('missions')
      .select(MISSION_SELECT)
      .eq('id', id)
      .returns<MissionWithRelations[]>()
      .maybeSingle()

    if (error || !data) {
      throw new NotFoundException('Mission introuvable')
    }

    const entreprise = data.entreprise ?? (data.entreprise_id
      ? await this.accessService.findEntreprise(String(data.entreprise_id))
      : null)
    if (!entreprise || !this.accessService.canAccessEntreprise(user, entreprise)) {
      throw new ForbiddenException('Accès interdit')
    }

    const entrepriseDto = this.toEntrepriseDTO(entreprise)
    const missionDto = this.toMissionDTO(data)
    const clientDto = this.toClientDTO(data.client ?? null)
    const missionMailPayload: MissionMailerPayload = {
      ...missionDto,
      client_id: data.client_id ?? null,
      client: data.client ?? null,
    }

    await this.mailerNotifications.missionStatusChangedToClient(
      missionMailPayload,
      entrepriseDto,
    )
    await this.mailerNotifications.missionAckToClient(
      clientDto,
      missionDto,
      entrepriseDto,
    )

    return { sent: true }
  }
}
