// src/entreprises/cv/cv.service.ts
// -------------------------------------------------------------
// Service : Entreprises › CV
// -------------------------------------------------------------
//
// 📌 Description :
//   - Gère les sections du CV liées à une entreprise (freelance)
//   - CRUD sur :
//       • Profil principal
//       • Compétences
//       • Expériences
//       • Formations
//
// 🔒 Règles d’accès :
//   - Lecture publique (GET)
//   - Écriture réservée à l’owner ou admin (PUT)
//
// ⚙️ Dépendances :
//   - SupabaseService pour les opérations SQL
//   - AccessService pour les permissions d’entreprise
//
// -------------------------------------------------------------

import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { AccessService } from '../../common/auth/access.service';
import type { AuthUser } from '../../common/auth/auth.types';
import { SupabaseService } from '../../common/supabase/supabase.service';
import type { Database } from '../../types/database';

// -------------------------------------------------------------
// Typages Supabase
// -------------------------------------------------------------
type CvProfile = Database['public']['Tables']['cv_profiles']['Row'];
type CvSkill = Database['public']['Tables']['cv_skills']['Row'];
type CvExperience = Database['public']['Tables']['cv_experiences']['Row'];
type CvEducation = Database['public']['Tables']['cv_education']['Row'];

@Injectable()
export class CvService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly accessService: AccessService,
  ) {}

  // -------------------------------------------------------------
  // 👤 Profil principal
  // -------------------------------------------------------------
  async getProfile(ref: string): Promise<CvProfile | null> {
    const entreprise = await this.accessService.findEntreprise(ref);

    const { data, error } = await this.supabase
      .getAdminClient()
      .from('cv_profiles')
      .select('*')
      .eq('entreprise_id', entreprise.id)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return data ?? null;
  }

  async updateProfile(
    ref: string,
    dto: Partial<CvProfile>,
    user: AuthUser,
  ): Promise<CvProfile> {
    const entreprise = await this.accessService.findEntreprise(ref);

    if (!this.accessService.canAccessEntreprise(user, entreprise)) {
      throw new ForbiddenException('Accès interdit');
    }

    const { id, ...safeDto } = dto;

    const { data, error } = await this.supabase
      .getAdminClient()
      .from('cv_profiles')
      .update(safeDto)
      .eq('entreprise_id', entreprise.id)
      .select('*')
      .single();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return data;
  }

  // -------------------------------------------------------------
  // 🧠 Compétences
  // -------------------------------------------------------------
  async getSkills(ref: string): Promise<CvSkill[]> {
    const entreprise = await this.accessService.findEntreprise(ref);

    const { data, error } = await this.supabase
      .getAdminClient()
      .from('cv_skills')
      .select('*')
      .eq('entreprise_id', entreprise.id)
      .order('id', { ascending: true });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return data ?? [];
  }

  // -------------------------------------------------------------
  // 💼 Expériences
  // -------------------------------------------------------------
  async getExperiences(ref: string): Promise<CvExperience[]> {
    const entreprise = await this.accessService.findEntreprise(ref);

    const { data, error } = await this.supabase
      .getAdminClient()
      .from('cv_experiences')
      .select('*')
      .eq('entreprise_id', entreprise.id)
      .order('start_date', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return data ?? [];
  }

  // -------------------------------------------------------------
  // 🎓 Formations
  // -------------------------------------------------------------
  async getEducation(ref: string): Promise<CvEducation[]> {
    const entreprise = await this.accessService.findEntreprise(ref);

    const { data, error } = await this.supabase
      .getAdminClient()
      .from('cv_education')
      .select('*')
      .eq('entreprise_id', entreprise.id)
      .order('year', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return data ?? [];
  }
}
