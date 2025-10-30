// src/mission-templates/mission-templates.service.ts
// -------------------------------------------------------------
// Service : Mission Templates
// -------------------------------------------------------------
//
// 📌 Description :
//   - CRUD complet sur la table `mission_templates`
//   - Portage direct des endpoints historiques `/api/clients/templates`
//
// -------------------------------------------------------------

import { ForbiddenException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';

import type { AuthUser } from '../common/auth/auth.types';
import { SupabaseService } from '../common/supabase/supabase.service';
import type { Tables } from '../common/types/database';
import type { CreateTemplateDto } from './dto/create-template.dto';
import type { UpdateTemplateDto } from './dto/update-template.dto';

@Injectable()
export class MissionTemplatesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  private ensureClient(user: AuthUser | null): asserts user is AuthUser {
    if (!user) {
      throw new UnauthorizedException('Authentification requise');
    }
    if (user.role !== 'client') {
      throw new ForbiddenException('Accès réservé aux clients');
    }
  }

  async listTemplates(user: AuthUser | null) {
    this.ensureClient(user);
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('mission_templates')
      .select('*')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return { templates: data ?? [] };
  }

  async createTemplate(dto: CreateTemplateDto, user: AuthUser | null) {
    this.ensureClient(user);

    if (!dto.nom || !dto.etablissement) {
      throw new ForbiddenException('Champs requis manquants : nom, etablissement');
    }

    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('mission_templates')
      .insert([{ ...dto, client_id: user.id }])
      .select()
      .single<Tables<'mission_templates'>>();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return { template: data };
  }

  async updateTemplate(id: number, dto: UpdateTemplateDto, user: AuthUser | null) {
    this.ensureClient(user);
    const admin = this.supabaseService.getAdminClient();

    const { data, error } = await admin
      .from('mission_templates')
      .update(dto)
      .eq('id', id)
      .eq('client_id', user.id)
      .select()
      .maybeSingle<Tables<'mission_templates'>>();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    if (!data) {
      throw new NotFoundException('Template introuvable');
    }

    return { template: data };
  }

  async deleteTemplate(id: number, user: AuthUser | null) {
    this.ensureClient(user);
    const admin = this.supabaseService.getAdminClient();

    const { error, count } = await admin
      .from('mission_templates')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('client_id', user.id);

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    if ((count ?? 0) === 0) {
      throw new NotFoundException('Template introuvable');
    }

    return { success: true };
  }
}
