import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'

import { AccessService } from '../../common/auth/access.service'
import type { AuthUser } from '../../common/auth/auth.types'
import { SupabaseService } from '../../common/supabase/supabase.service'
import type { Database } from '../../types/database'

type CvProfile = Database['public']['Tables']['cv_profiles']['Row']
type CvSkill = Database['public']['Tables']['cv_skills']['Row']
type CvExperience = Database['public']['Tables']['cv_experiences']['Row']
type CvEducation = Database['public']['Tables']['cv_education']['Row']

@Injectable()
export class CvService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly accessService: AccessService,
  ) {}

  async getProfile(ref: string): Promise<CvProfile | null> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('cv_profiles')
      .select('*')
      .eq('entreprise_ref', ref)
      .maybeSingle()

    if (error) {
      throw new InternalServerErrorException(error.message)
    }

    return data ?? null
  }

  async updateProfile(
    ref: string,
    dto: Partial<CvProfile>,
    user: AuthUser,
  ): Promise<CvProfile> {
    const entreprise = await this.accessService.findEntreprise(ref)

    if (!this.accessService.canAccessEntreprise(user, entreprise)) {
      throw new ForbiddenException('Accès interdit')
    }

    const { data, error } = await this.supabase
      .getAdminClient()
      .from('cv_profiles')
      .update(dto)
      .eq('entreprise_ref', ref)
      .select('*')
      .single()

    if (error) {
      throw new InternalServerErrorException(error.message)
    }

    return data
  }

  async getSkills(ref: string): Promise<CvSkill[]> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('cv_skills')
      .select('*')
      .eq('entreprise_ref', ref)
      .order('id', { ascending: true })

    if (error) {
      throw new InternalServerErrorException(error.message)
    }

    return data ?? []
  }

  async getExperiences(ref: string): Promise<CvExperience[]> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('cv_experiences')
      .select('*')
      .eq('entreprise_ref', ref)
      .order('start_date', { ascending: false })

    if (error) {
      throw new InternalServerErrorException(error.message)
    }

    return data ?? []
  }

  async getEducation(ref: string): Promise<CvEducation[]> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('cv_education')
      .select('*')
      .eq('entreprise_ref', ref)
      .order('start_date', { ascending: false })

    if (error) {
      throw new InternalServerErrorException(error.message)
    }

    return data ?? []
  }
}
