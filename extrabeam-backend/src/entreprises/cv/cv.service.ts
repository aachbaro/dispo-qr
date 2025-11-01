// src/entreprises/cv/cv.service.ts
// -------------------------------------------------------------
// Service : Entreprises › CV
// -------------------------------------------------------------
//
// 📌 Description :
//   - Gère les différentes sections du CV liées à une entreprise (freelance)
//   - Fournit les opérations CRUD pour :
//       • Profil principal
//       • Compétences
//       • Expériences
//       • Formations
//
// 🧱 Architecture :
//   - Appelé par CvController
//   - Utilise SupabaseService pour interagir avec la base
//
// 🔒 Règles d’accès :
//   - Lecture publique
//   - Écriture réservée au propriétaire ou admin
//
// ⚠️ Remarques :
//   - Implémentation simplifiée (mock ou lecture Supabase à ajouter)
//   - Typage fort basé sur src/types/database.ts
//
// -------------------------------------------------------------

import { Injectable, InternalServerErrorException } from '@nestjs/common'

import { SupabaseService } from '../../common/supabase/supabase.service'
import type { Table } from '../../types/aliases'

// -------------------------------------------------------------
// Typages dérivés de Supabase
// -------------------------------------------------------------
type CvProfile = Table<'cv_profiles'>
type CvSkill = Table<'cv_skills'>
type CvExperience = Table<'cv_experiences'>
type CvEducation = Table<'cv_education'>

@Injectable()
export class CvService {
  constructor(private readonly supabase: SupabaseService) {}

  // -------------------------------------------------------------
  // 👤 Profil principal
  // -------------------------------------------------------------
  async getProfile(ref: string): Promise<CvProfile | null> {
    const client = this.supabase.getAdminClient()
    const { data, error } = await client
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
  ): Promise<CvProfile> {
    const client = this.supabase.getAdminClient()
    const { id, ...safeDto } = dto

    const { data, error } = await client
      .from('cv_profiles')
      .update(safeDto)
      .eq('entreprise_ref', ref)
      .select()
      .single()

    if (error) {
      throw new InternalServerErrorException(error.message)
    }

    return data
  }

  // -------------------------------------------------------------
  // 🧠 Compétences
  // -------------------------------------------------------------
  async getSkills(ref: string): Promise<CvSkill[]> {
    const client = this.supabase.getAdminClient()
    const { data, error } = await client
      .from('cv_skills')
      .select('*')
      .eq('entreprise_ref', ref)
      .order('id', { ascending: true })

    if (error) {
      throw new InternalServerErrorException(error.message)
    }

    return data ?? []
  }

  // -------------------------------------------------------------
  // 💼 Expériences
  // -------------------------------------------------------------
  async getExperiences(ref: string): Promise<CvExperience[]> {
    const client = this.supabase.getAdminClient()
    const { data, error } = await client
      .from('cv_experiences')
      .select('*')
      .eq('entreprise_ref', ref)
      .order('start_date', { ascending: false })

    if (error) {
      throw new InternalServerErrorException(error.message)
    }

    return data ?? []
  }

  // -------------------------------------------------------------
  // 🎓 Formations
  // -------------------------------------------------------------
  async getEducation(ref: string): Promise<CvEducation[]> {
    const client = this.supabase.getAdminClient()
    const { data, error } = await client
      .from('cv_education')
      .select('*')
      .eq('entreprise_ref', ref)
      .order('start_date', { ascending: false })

    if (error) {
      throw new InternalServerErrorException(error.message)
    }

    return data ?? []
  }

  // -------------------------------------------------------------
  // 🧩 CV complet
  // -------------------------------------------------------------
  async getFullCv(ref: string): Promise<{
    profile: CvProfile | null
    skills: CvSkill[]
    experiences: CvExperience[]
    education: CvEducation[]
  }> {
    const [profile, skills, experiences, education] = await Promise.all([
      this.getProfile(ref),
      this.getSkills(ref),
      this.getExperiences(ref),
      this.getEducation(ref),
    ])

    return { profile, skills, experiences, education }
  }
}
