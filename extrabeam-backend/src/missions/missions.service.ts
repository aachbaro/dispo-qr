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
} from '@nestjs/common';

import type { AuthUser } from '../common/auth/auth.types';
import { AccessService } from '../common/auth/access.service';
import { SupabaseService } from '../common/supabase/supabase.service';
import type { Enums, Tables } from '../common/types/database';
import type { CreateMissionDto, MissionSlotInput } from './dto/create-mission.dto';
import type { UpdateMissionDto } from './dto/update-mission.dto';

const ENTREPRISE_ROLES = new Set(['freelance', 'entreprise', 'admin']);
const MISSION_SELECT = '*, slots(*), entreprise:entreprise_id(*), client:client_id(*)';

export type MissionWithRelations = Tables<'missions'> & {
  slots: Tables<'slots'>[];
  entreprise: Tables<'entreprise'> | null;
  client: Tables<'profiles'> | null;
};

interface GetMissionsParams {
  entrepriseRef?: string;
  week?: string;
  status?: Enums<'mission_status'>;
  page?: number;
  size?: number;
}

@Injectable()
export class MissionsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly accessService: AccessService,
  ) {}

  private ensureAuthenticated(user: AuthUser | null): asserts user is AuthUser {
    if (!user) {
      throw new UnauthorizedException('Authentification requise');
    }
  }

  private async loadEntrepriseForUser(
    user: AuthUser,
    entrepriseRef?: string | number | null,
  ): Promise<Tables<'entreprise'>> {
    const ref = entrepriseRef ?? user.slug ?? user.id;
    if (!ref) {
      throw new BadRequestException('Référence entreprise manquante');
    }

    const entreprise = await this.accessService.findEntreprise(String(ref));
    if (!this.accessService.canAccessEntreprise(user, entreprise)) {
      throw new ForbiddenException("Accès interdit à l'entreprise");
    }

    return entreprise;
  }

  private validateStatus(status: string) {
    const allowed: Array<Enums<'mission_status'>> = [
      'proposed',
      'validated',
      'pending_payment',
      'paid',
      'completed',
      'refused',
      'realized',
    ];

    if (status && !allowed.includes(status as Enums<'mission_status'>)) {
      throw new BadRequestException('Statut mission invalide');
    }
  }

  private computeWeekRange(week?: string): { start?: string; end?: string } {
    if (!week) return {};

    const base = new Date(week);
    if (Number.isNaN(base.getTime())) {
      throw new BadRequestException('Paramètre week invalide');
    }

    const day = base.getUTCDay();
    const diff = (day === 0 ? -6 : 1 - day); // Lundi comme début de semaine
    const monday = new Date(base);
    monday.setUTCDate(base.getUTCDate() + diff);
    monday.setUTCHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 7);

    return {
      start: monday.toISOString(),
      end: sunday.toISOString(),
    };
  }

  private normalizeSlots(
    slots: MissionSlotInput[] | null | undefined,
    missionId: number,
    entrepriseId: number,
  ) {
    if (!slots || slots.length === 0) {
      return [];
    }

    return slots.map((slot) => ({
      start: slot.start,
      end: slot.end,
      title: slot.title ?? null,
      mission_id: missionId,
      entreprise_id: entrepriseId,
    })) as Tables<'slots'>[];
  }

  async getMissions(params: GetMissionsParams, user: AuthUser | null): Promise<{ missions: MissionWithRelations[] }> {
    this.ensureAuthenticated(user);

    const role = user.role ?? '';
    const admin = this.supabaseService.getAdminClient();

    if (ENTREPRISE_ROLES.has(role)) {
      const entreprise = await this.loadEntrepriseForUser(user, params.entrepriseRef);

      let query = admin
        .from('missions')
        .select(MISSION_SELECT)
        .eq('entreprise_id', entreprise.id)
        .order('created_at', { ascending: false });

      if (params.status) {
        query = query.eq('status', params.status);
      }

      const { start, end } = this.computeWeekRange(params.week);
      if (start && end) {
        query = query.gte('created_at', start).lt('created_at', end);
      }

      const size = Math.max(1, Math.min(params.size ?? 50, 200));
      const page = Math.max(0, (params.page ?? 1) - 1);
      const from = page * size;
      const to = from + size - 1;

      query = query.range(from, to);

      const { data, error } = await query;
      if (error) {
        throw new InternalServerErrorException(error.message);
      }

      return { missions: (data as MissionWithRelations[]) ?? [] };
    }

    if (role === 'client') {
      let query = admin
        .from('missions')
        .select(MISSION_SELECT)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (params.status) {
        query = query.eq('status', params.status);
      }

      const { start, end } = this.computeWeekRange(params.week);
      if (start && end) {
        query = query.gte('created_at', start).lt('created_at', end);
      }

      const size = Math.max(1, Math.min(params.size ?? 50, 200));
      const page = Math.max(0, (params.page ?? 1) - 1);
      const from = page * size;
      const to = from + size - 1;

      query = query.range(from, to);

      const { data, error } = await query;
      if (error) {
        throw new InternalServerErrorException(error.message);
      }

      return { missions: (data as MissionWithRelations[]) ?? [] };
    }

    throw new ForbiddenException('Rôle non autorisé');
  }

  async getMissionById(id: number, user: AuthUser | null): Promise<{ mission: MissionWithRelations }> {
    this.ensureAuthenticated(user);

    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('missions')
      .select(MISSION_SELECT)
      .eq('id', id)
      .maybeSingle<MissionWithRelations>();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException('Mission introuvable');
      }
      throw new InternalServerErrorException(error.message);
    }

    if (!data) {
      throw new NotFoundException('Mission introuvable');
    }

    const role = user.role ?? '';

    if (ENTREPRISE_ROLES.has(role)) {
      const entreprise = data.entreprise ?? (data.entreprise_id ? await this.accessService.findEntreprise(String(data.entreprise_id)) : null);
      if (!entreprise || !this.accessService.canAccessEntreprise(user, entreprise)) {
        throw new ForbiddenException('Accès interdit');
      }
    } else if (role === 'client') {
      if (data.client_id !== user.id) {
        throw new ForbiddenException('Accès interdit à cette mission');
      }
    } else {
      throw new ForbiddenException('Rôle non autorisé');
    }

    return { mission: data };
  }

  async createMission(input: CreateMissionDto, user: AuthUser | null): Promise<Tables<'missions'>> {
    this.ensureAuthenticated(user);

    const role = user.role ?? '';
    const admin = this.supabaseService.getAdminClient();

    if (ENTREPRISE_ROLES.has(role)) {
      const entreprise = await this.loadEntrepriseForUser(user, input.entrepriseRef ?? input.entreprise_id ?? null);

      const payload: CreateMissionDto = {
        ...input,
        entreprise_id: entreprise.id,
        client_id: input.client_id ?? null,
        status: input.status ?? ('proposed' as Enums<'mission_status'>),
      };

      const { slots, ...missionData } = payload;

      const { data, error } = await admin
        .from('missions')
        .insert(missionData)
        .select()
        .single<Tables<'missions'>>();

      if (error) {
        throw new InternalServerErrorException(error.message);
      }

      if (slots?.length) {
        const formattedSlots = this.normalizeSlots(slots, data.id, entreprise.id);
        const { error: slotsError } = await admin.from('slots').insert(formattedSlots.map((slot) => ({
          start: slot.start!,
          end: slot.end!,
          title: slot.title ?? null,
          mission_id: slot.mission_id!,
          entreprise_id: slot.entreprise_id!,
        })));
        if (slotsError) {
          throw new InternalServerErrorException(slotsError.message);
        }
      }

      return data;
    }

    if (role === 'client') {
      const payload: CreateMissionDto = {
        ...input,
        client_id: user.id,
        entreprise_id: input.entreprise_id ?? null,
        status: 'proposed',
      };

      const { slots, ...missionData } = payload;
      const { data, error } = await admin
        .from('missions')
        .insert(missionData)
        .select()
        .single<Tables<'missions'>>();

      if (error) {
        throw new InternalServerErrorException(error.message);
      }

      if (slots?.length && data.entreprise_id) {
        const formattedSlots = this.normalizeSlots(slots, data.id, data.entreprise_id);
        const { error: slotsError } = await admin.from('slots').insert(formattedSlots.map((slot) => ({
          start: slot.start!,
          end: slot.end!,
          title: slot.title ?? null,
          mission_id: slot.mission_id!,
          entreprise_id: slot.entreprise_id!,
        })));
        if (slotsError) {
          throw new InternalServerErrorException(slotsError.message);
        }
      }

      return data;
    }

    throw new ForbiddenException('Rôle non autorisé');
  }

  async updateMission(id: number, input: UpdateMissionDto, user: AuthUser | null): Promise<MissionWithRelations> {
    this.ensureAuthenticated(user);

    const admin = this.supabaseService.getAdminClient();
    const current = await this.getMissionById(id, user);
    const mission = current.mission;

    if (!mission.entreprise_id) {
      throw new BadRequestException("Mission sans entreprise liée");
    }

    const entreprise = await this.accessService.findEntreprise(String(mission.entreprise_id));
    if (!this.accessService.canAccessEntreprise(user, entreprise)) {
      throw new ForbiddenException('Accès interdit');
    }

    if (input.status) {
      this.validateStatus(input.status);
    }

    const { slots, ...updates } = input;

    if (Object.keys(updates).length > 0) {
      const { error } = await admin
        .from('missions')
        .update(updates)
        .eq('id', id)
        .eq('entreprise_id', mission.entreprise_id);

      if (error) {
        throw new InternalServerErrorException(error.message);
      }
    }

    if (Array.isArray(slots)) {
      const { error: deleteError } = await admin.from('slots').delete().eq('mission_id', id);
      if (deleteError) {
        throw new InternalServerErrorException(deleteError.message);
      }

      if (slots.length > 0) {
        const formattedSlots = this.normalizeSlots(slots, id, mission.entreprise_id);
        const { error: insertError } = await admin.from('slots').insert(formattedSlots.map((slot) => ({
          start: slot.start!,
          end: slot.end!,
          title: slot.title ?? null,
          mission_id: slot.mission_id!,
          entreprise_id: slot.entreprise_id!,
        })));
        if (insertError) {
          throw new InternalServerErrorException(insertError.message);
        }
      }
    }

    const { data: refreshed, error: fetchError } = await admin
      .from('missions')
      .select(MISSION_SELECT)
      .eq('id', id)
      .maybeSingle<MissionWithRelations>();

    if (fetchError) {
      throw new InternalServerErrorException(fetchError.message);
    }
    if (!refreshed) {
      throw new NotFoundException('Mission introuvable');
    }

    return refreshed;
  }

  async deleteMission(id: number, user: AuthUser | null): Promise<{ success: true }> {
    this.ensureAuthenticated(user);

    const admin = this.supabaseService.getAdminClient();
    const { mission } = await this.getMissionById(id, user);

    if (!mission.entreprise_id) {
      throw new BadRequestException('Mission sans entreprise');
    }

    const entreprise = await this.accessService.findEntreprise(String(mission.entreprise_id));
    if (!this.accessService.canAccessEntreprise(user, entreprise)) {
      throw new ForbiddenException('Accès interdit');
    }

    const { error: slotError } = await admin.from('slots').delete().eq('mission_id', id);
    if (slotError) {
      throw new InternalServerErrorException(slotError.message);
    }

    const { error } = await admin.from('missions').delete().eq('id', id);
    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return { success: true };
  }

  async updateMissionStatus(
    id: number,
    status: Enums<'mission_status'>,
    user: AuthUser | null,
  ): Promise<Tables<'missions'>> {
    this.ensureAuthenticated(user);
    this.validateStatus(status);

    const admin = this.supabaseService.getAdminClient();
    const { mission } = await this.getMissionById(id, user);

    if (!mission.entreprise_id) {
      throw new BadRequestException('Mission sans entreprise');
    }

    const entreprise = await this.accessService.findEntreprise(String(mission.entreprise_id));
    if (!this.accessService.canAccessEntreprise(user, entreprise)) {
      throw new ForbiddenException('Accès interdit');
    }

    const { data, error } = await admin
      .from('missions')
      .update({ status })
      .eq('id', id)
      .eq('entreprise_id', mission.entreprise_id)
      .select()
      .single<Tables<'missions'>>();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return data;
  }
}
