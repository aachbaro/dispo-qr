// src/missions/missions.service.ts
// -------------------------------------------------------------
// Service : Missions
// -------------------------------------------------------------
//
// 📌 Description :
//   - Reprend la logique historique de l'API Vercel pour la gestion des missions
//   - Gère la lecture (liste + détail) et les mutations (création, mise à jour, statut)
//   - Interagit avec Supabase via le client admin
//
// 📍 Endpoints :
//   - GET    /api/missions
//   - GET    /api/missions/:id
//   - POST   /api/missions
//   - PUT    /api/missions/:id
//   - DELETE /api/missions/:id
//   - POST   /api/missions/:id/status
//
// 🔒 Règles d’accès :
//   - Lecture protégée par JwtAuthGuard (comme l’API historique)
//   - Mutations réservées au propriétaire (ou admin) de l’entreprise concernée
//
// ⚠️ Remarques :
//   - Utilise les DTO typés (`CreateMissionDto`, `UpdateMissionDto`...)
//   - Vérifie systématiquement les droits via `AccessService`
//   - Les slots sont recréés à chaque mise à jour pour rester fidèle à l’historique
//
// -------------------------------------------------------------

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'

import { AccessService } from '../common/auth/access.service'
import { SupabaseService } from '../common/supabase/supabase.service'
import type { AuthUser } from '../common/auth/auth.types'
import type { Enum, Insert, Table } from '../types/aliases'
import type {
  MissionCreatePayload,
  MissionSlotDto,
} from './dto/mission-create.dto'
import type { MissionUpdatePayload } from './dto/mission-update.dto'

type MissionRow = Table<'missions'>
type MissionInsert = Insert<'missions'>
type SlotRow = Table<'slots'>
type SlotInsert = Insert<'slots'>
type EntrepriseRow = Table<'entreprise'>
type ProfileRow = Table<'profiles'>
type MissionStatus = Enum<'mission_status'>
type EntrepriseRole = 'freelance' | 'entreprise' | 'admin'

const ENTREPRISE_ROLES = new Set<EntrepriseRole>([
  'freelance',
  'entreprise',
  'admin',
])
const MISSION_SELECT = '*, slots(*), entreprise:entreprise_id(*), client:client_id(*)'

export type MissionWithRelations = MissionRow & {
  slots: SlotRow[]
  entreprise: EntrepriseRow | null
  client: ProfileRow | null
}

interface ListMissionsParams {
  entrepriseRef?: string
  week?: string
  status?: MissionStatus
  page?: number
  size?: number
}

@Injectable()
export class MissionsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly accessService: AccessService,
  ) {}

  private ensureAuthenticated(user: AuthUser | null): asserts user is AuthUser {
    if (!user) {
      throw new UnauthorizedException('Authentification requise')
    }
  }

  private async loadEntrepriseForUser(
    user: AuthUser,
    entrepriseRef?: string | number | null,
  ): Promise<EntrepriseRow> {
    const ref = entrepriseRef ?? user.slug ?? user.id
    if (!ref) {
      throw new BadRequestException('Référence entreprise manquante')
    }

    const entreprise = await this.accessService.findEntreprise(String(ref))
    if (!this.accessService.canAccessEntreprise(user, entreprise)) {
      throw new ForbiddenException("Accès interdit à l'entreprise")
    }

    return entreprise
  }

  private validateStatus(status: string | null | undefined) {
    if (!status) {
      return
    }

    const allowed: MissionStatus[] = [
      'proposed',
      'validated',
      'pending_payment',
      'paid',
      'completed',
      'refused',
      'realized',
    ]

    if (!allowed.includes(status as MissionStatus)) {
      throw new BadRequestException('Statut mission invalide')
    }
  }

  private computeWeekRange(week?: string): { start?: string; end?: string } {
    if (!week) return {}

    const base = new Date(week)
    if (Number.isNaN(base.getTime())) {
      throw new BadRequestException('Paramètre week invalide')
    }

    const day = base.getUTCDay()
    const diff = day === 0 ? -6 : 1 - day // Lundi comme début de semaine
    const monday = new Date(base)
    monday.setUTCDate(base.getUTCDate() + diff)
    monday.setUTCHours(0, 0, 0, 0)

    const sunday = new Date(monday)
    sunday.setUTCDate(monday.getUTCDate() + 7)

    return {
      start: monday.toISOString(),
      end: sunday.toISOString(),
    }
  }

  private normalizeSlots(
    slots: MissionSlotDto[] | null | undefined,
    missionId: number,
    entrepriseId: number,
  ): SlotInsert[] {
    if (!slots || slots.length === 0) {
      return []
    }

    return slots.map((slot) => ({
      start: slot.start,
      end: slot.end,
      title: slot.title ?? null,
      mission_id: missionId,
      entreprise_id: entrepriseId,
    }))
  }

  private buildMissionInsert(payload: MissionCreatePayload): MissionInsert {
    return {
      client_id: payload.client_id ?? null,
      contact_email: payload.contact_email,
      contact_name: payload.contact_name ?? null,
      contact_phone: payload.contact_phone,
      created_at: payload.created_at ?? undefined,
      devis_url: payload.devis_url ?? null,
      entreprise_id: payload.entreprise_id ?? null,
      etablissement: payload.etablissement,
      etablissement_adresse_ligne1: payload.etablissement_adresse_ligne1 ?? null,
      etablissement_adresse_ligne2: payload.etablissement_adresse_ligne2 ?? null,
      etablissement_code_postal: payload.etablissement_code_postal ?? null,
      etablissement_pays: payload.etablissement_pays ?? null,
      etablissement_ville: payload.etablissement_ville ?? null,
      freelance_id: payload.freelance_id ?? null,
      id: payload.id ?? undefined,
      instructions: payload.instructions ?? null,
      mode: payload.mode ?? undefined,
      status: payload.status ?? undefined,
    }
  }

  async listMissions(
    params: ListMissionsParams,
    user: AuthUser | null,
  ): Promise<MissionWithRelations[]> {
    this.ensureAuthenticated(user)

    const role = user.role ?? ''
    const admin = this.supabaseService.getAdminClient()

    if (ENTREPRISE_ROLES.has(role as EntrepriseRole)) {
      const entreprise = await this.loadEntrepriseForUser(user, params.entrepriseRef)

      let query = admin
        .from('missions')
        .select(MISSION_SELECT)
        .eq('entreprise_id', entreprise.id)
        .order('created_at', { ascending: false })

      if (params.status) {
        query = query.eq('status', params.status)
      }

      const { start, end } = this.computeWeekRange(params.week)
      if (start && end) {
        query = query.gte('created_at', start).lt('created_at', end)
      }

      const size = Math.max(1, Math.min(params.size ?? 50, 200))
      const page = Math.max(0, (params.page ?? 1) - 1)
      const from = page * size
      const to = from + size - 1

      const { data, error } = await query.range(from, to).returns<MissionWithRelations[]>()
      if (error) {
        throw new InternalServerErrorException(error.message)
      }

      return data ?? []
    }

    if (role === 'client') {
      let query = admin
        .from('missions')
        .select(MISSION_SELECT)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })

      if (params.status) {
        query = query.eq('status', params.status)
      }

      const { start, end } = this.computeWeekRange(params.week)
      if (start && end) {
        query = query.gte('created_at', start).lt('created_at', end)
      }

      const size = Math.max(1, Math.min(params.size ?? 50, 200))
      const page = Math.max(0, (params.page ?? 1) - 1)
      const from = page * size
      const to = from + size - 1

      const { data, error } = await query.range(from, to).returns<MissionWithRelations[]>()
      if (error) {
        throw new InternalServerErrorException(error.message)
      }

      return data ?? []
    }

    throw new ForbiddenException('Rôle non autorisé')
  }

  async getMission(id: number, user: AuthUser | null): Promise<MissionWithRelations> {
    this.ensureAuthenticated(user)

    const admin = this.supabaseService.getAdminClient()
    const { data, error } = await admin
      .from('missions')
      .select(MISSION_SELECT)
      .eq('id', id)
      .maybeSingle<MissionWithRelations>()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException('Mission introuvable')
      }
      throw new InternalServerErrorException(error.message)
    }

    if (!data) {
      throw new NotFoundException('Mission introuvable')
    }

    const role = user.role ?? ''

    if (ENTREPRISE_ROLES.has(role as EntrepriseRole)) {
      const entreprise =
        data.entreprise ??
        (data.entreprise_id
          ? await this.accessService.findEntreprise(String(data.entreprise_id))
          : null)
      if (!entreprise || !this.accessService.canAccessEntreprise(user, entreprise)) {
        throw new ForbiddenException('Accès interdit')
      }
    } else if (role === 'client') {
      if (data.client_id !== user.id) {
        throw new ForbiddenException('Accès interdit à cette mission')
      }
    } else {
      throw new ForbiddenException('Rôle non autorisé')
    }

    return data
  }

  async createMission(
    input: MissionCreatePayload,
    user: AuthUser | null,
  ): Promise<MissionRow> {
    this.ensureAuthenticated(user)

    const role = user.role ?? ''
    const admin = this.supabaseService.getAdminClient()

    if (ENTREPRISE_ROLES.has(role as EntrepriseRole)) {
      const entreprise = await this.loadEntrepriseForUser(
        user,
        input.entrepriseRef ?? input.entreprise_id ?? null,
      )

      const missionData: MissionInsert = {
        ...this.buildMissionInsert(input),
        entreprise_id: entreprise.id,
        client_id: input.client_id ?? null,
        status: input.status ?? 'proposed',
      }

      const { data, error } = await admin
        .from('missions')
        .insert(missionData)
        .select()
        .single<MissionRow>()

      if (error) {
        throw new InternalServerErrorException(error.message)
      }

      if (input.slots?.length) {
        const formattedSlots = this.normalizeSlots(input.slots, data.id, entreprise.id)
        const { error: slotsError } = await admin.from('slots').insert(formattedSlots)
        if (slotsError) {
          throw new InternalServerErrorException(slotsError.message)
        }
      }

      return data
    }

    if (role === 'client') {
      const missionData: MissionInsert = {
        ...this.buildMissionInsert(input),
        client_id: user.id,
        status: 'proposed',
      }

      const { data, error } = await admin
        .from('missions')
        .insert(missionData)
        .select()
        .single<MissionRow>()

      if (error) {
        throw new InternalServerErrorException(error.message)
      }

      if (input.slots?.length && data.entreprise_id) {
        const formattedSlots = this.normalizeSlots(input.slots, data.id, data.entreprise_id)
        const { error: slotsError } = await admin.from('slots').insert(formattedSlots)
        if (slotsError) {
          throw new InternalServerErrorException(slotsError.message)
        }
      }

      return data
    }

    throw new ForbiddenException('Rôle non autorisé')
  }

  async updateMission(
    id: number,
    input: MissionUpdatePayload,
    user: AuthUser | null,
  ): Promise<MissionWithRelations> {
    this.ensureAuthenticated(user)

    const admin = this.supabaseService.getAdminClient()
    const mission = await this.getMission(id, user)

    if (!mission.entreprise_id) {
      throw new BadRequestException('Mission sans entreprise liée')
    }

    const entreprise = await this.accessService.findEntreprise(String(mission.entreprise_id))
    if (!this.accessService.canAccessEntreprise(user, entreprise)) {
      throw new ForbiddenException('Accès interdit')
    }

    if (input.status) {
      this.validateStatus(input.status)
    }

    const { slots, ...updates } = input

    if (Object.keys(updates).length > 0) {
      const { error } = await admin
        .from('missions')
        .update(updates)
        .eq('id', id)
        .eq('entreprise_id', mission.entreprise_id)

      if (error) {
        throw new InternalServerErrorException(error.message)
      }
    }

    if (Array.isArray(slots)) {
      const { error: deleteError } = await admin.from('slots').delete().eq('mission_id', id)
      if (deleteError) {
        throw new InternalServerErrorException(deleteError.message)
      }

      if (slots.length > 0) {
        const formattedSlots = this.normalizeSlots(slots, id, mission.entreprise_id)
        const { error: insertError } = await admin.from('slots').insert(formattedSlots)
        if (insertError) {
          throw new InternalServerErrorException(insertError.message)
        }
      }
    }

    return this.getMission(id, user)
  }

  async deleteMission(id: number, user: AuthUser | null): Promise<void> {
    this.ensureAuthenticated(user)

    const admin = this.supabaseService.getAdminClient()
    const mission = await this.getMission(id, user)

    if (!mission.entreprise_id) {
      throw new BadRequestException('Mission sans entreprise')
    }

    const entreprise = await this.accessService.findEntreprise(String(mission.entreprise_id))
    if (!this.accessService.canAccessEntreprise(user, entreprise)) {
      throw new ForbiddenException('Accès interdit')
    }

    const { error: slotError } = await admin.from('slots').delete().eq('mission_id', id)
    if (slotError) {
      throw new InternalServerErrorException(slotError.message)
    }

    const { error } = await admin.from('missions').delete().eq('id', id)
    if (error) {
      throw new InternalServerErrorException(error.message)
    }
  }

  async updateMissionStatus(
    id: number,
    status: MissionStatus,
    user: AuthUser | null,
  ): Promise<MissionRow> {
    this.ensureAuthenticated(user)
    this.validateStatus(status)

    const admin = this.supabaseService.getAdminClient()
    const mission = await this.getMission(id, user)

    if (!mission.entreprise_id) {
      throw new BadRequestException('Mission sans entreprise')
    }

    const entreprise = await this.accessService.findEntreprise(String(mission.entreprise_id))
    if (!this.accessService.canAccessEntreprise(user, entreprise)) {
      throw new ForbiddenException('Accès interdit')
    }

    const { data, error } = await admin
      .from('missions')
      .update({ status })
      .eq('id', id)
      .eq('entreprise_id', mission.entreprise_id)
      .select()
      .single<MissionRow>()

    if (error) {
      throw new InternalServerErrorException(error.message)
    }

    return data
  }
}
