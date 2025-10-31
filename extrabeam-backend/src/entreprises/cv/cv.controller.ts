// src/entreprises/cv/cv.controller.ts
// -------------------------------------------------------------
// Contrôleur : Entreprises › CV (profil complet + sous-sections)
// -------------------------------------------------------------
//
// 📌 Description :
//   - Point d’entrée des opérations CV liées à une entreprise (freelance)
//   - Permet la lecture et la mise à jour du profil complet :
//       • Profil principal
//       • Compétences
//       • Expériences
//       • Formations
//
// 📍 Endpoints principaux :
//   - GET    /api/entreprises/:ref/cv               → CV complet
//   - GET    /api/entreprises/:ref/cv/profile       → Profil principal
//   - PUT    /api/entreprises/:ref/cv/profile       → Mise à jour profil
//   - GET    /api/entreprises/:ref/cv/skills        → Liste des skills
//   - GET    /api/entreprises/:ref/cv/experiences   → Liste des expériences
//   - GET    /api/entreprises/:ref/cv/education     → Liste des formations
//
// 🔒 Règles d’accès :
//   - Lecture publique (GET)
//   - Écriture réservée à l’owner ou admin (PUT)
//
// ⚠️ Remarques :
//   - getFullCv() regroupe toutes les sous-sections pour un rendu complet
//   - Les méthodes sous-jacentes (getProfile, getSkills, etc.) existent déjà
//
// -------------------------------------------------------------

import { Body, Controller, Get, Param, Put } from '@nestjs/common'
import { CvService } from './cv.service'
import type { Database } from '../../types/database'

// -------------------------------------------------------------
// Typages dérivés de Supabase
// -------------------------------------------------------------
type Table<Name extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][Name]['Row']

type CvProfile = Table<'cv_profiles'>
type CvSkill = Table<'cv_skills'>
type CvExperience = Table<'cv_experiences'>
type CvEducation = Table<'cv_education'>

@Controller('entreprises/:ref/cv')
export class CvController {
  constructor(private readonly cvService: CvService) {}

  // -------------------------------------------------------------
  // 🧱 GET /api/entreprises/:ref/cv
  // -------------------------------------------------------------
  @Get()
  async getFullCv(
    @Param('ref') ref: string,
  ): Promise<{
    profile: CvProfile | null
    skills: CvSkill[]
    experiences: CvExperience[]
    education: CvEducation[]
  }> {
    const [profile, skills, experiences, education] = await Promise.all([
      this.cvService.getProfile(ref),
      this.cvService.getSkills(ref),
      this.cvService.getExperiences(ref),
      this.cvService.getEducation(ref),
    ])

    return { profile, skills, experiences, education }
  }

  // -------------------------------------------------------------
  // 👤 GET /api/entreprises/:ref/cv/profile
  // -------------------------------------------------------------
  @Get('profile')
  async getProfile(@Param('ref') ref: string): Promise<CvProfile | null> {
    return this.cvService.getProfile(ref)
  }

  // -------------------------------------------------------------
  // 🛠️ PUT /api/entreprises/:ref/cv/profile
  // -------------------------------------------------------------
  @Put('profile')
  async updateProfile(
    @Param('ref') ref: string,
    @Body() dto: Partial<CvProfile>,
  ): Promise<CvProfile> {
    return this.cvService.updateProfile(ref, dto)
  }

  // -------------------------------------------------------------
  // 🧠 GET /api/entreprises/:ref/cv/skills
  // -------------------------------------------------------------
  @Get('skills')
  async getSkills(@Param('ref') ref: string): Promise<CvSkill[]> {
    return this.cvService.getSkills(ref)
  }

  // -------------------------------------------------------------
  // 💼 GET /api/entreprises/:ref/cv/experiences
  // -------------------------------------------------------------
  @Get('experiences')
  async getExperiences(@Param('ref') ref: string): Promise<CvExperience[]> {
    return this.cvService.getExperiences(ref)
  }

  // -------------------------------------------------------------
  // 🎓 GET /api/entreprises/:ref/cv/education
  // -------------------------------------------------------------
  @Get('education')
  async getEducation(@Param('ref') ref: string): Promise<CvEducation[]> {
    return this.cvService.getEducation(ref)
  }
}
