// src/entreprises/cv/cv.service.ts
// -------------------------------------------------------------
// Service : Entreprises › CV
// -------------------------------------------------------------
//
// 📌 Description :
//   - Point central pour la gestion du CV lié à une entreprise (freelance)
//   - Fournit les méthodes CRUD pour les différentes sections du CV :
//       • Profil principal
//       • Compétences
//       • Expériences
//       • Formations
//
// 🧱 Architecture :
//   - Appelé par CvController
//   - Utilise SupabaseService pour les requêtes à la base
//
// 🔒 Règles d’accès :
//   - Lecture publique
//   - Écriture réservée au propriétaire ou admin
//
// ⚠️ Remarques :
//   - Les méthodes sont typées et prêtes à être branchées à Supabase
//   - Implémentations temporaires → valeurs simulées pour éviter erreurs
//
// -------------------------------------------------------------

import { Injectable } from '@nestjs/common';
import type { CvProfile, CvSkill, CvExperience, CvEducation } from './cv.types';
import { SupabaseService } from '../../common/supabase/supabase.service';

@Injectable()
export class CvService {
  constructor(private readonly supabase: SupabaseService) {}

  // -------------------------------------------------------------
  // 👤 Profil principal
  // -------------------------------------------------------------
  async getProfile(ref: string): Promise<CvProfile | null> {
    // TODO: Requête Supabase (filtrer par slug entreprise)
    console.log(`Fetching CV profile for entreprise ${ref}`);
    return null;
  }

  async updateProfile(ref: string, dto: Partial<CvProfile>): Promise<CvProfile> {
    // TODO: Update Supabase row
    console.log(`Updating CV profile for entreprise ${ref}`, dto);
    return { ...dto, entreprise_ref: ref } as CvProfile;
  }

  // -------------------------------------------------------------
  // 🧠 Compétences
  // -------------------------------------------------------------
  async getSkills(ref: string): Promise<CvSkill[]> {
    console.log(`Fetching skills for entreprise ${ref}`);
    return [];
  }

  // -------------------------------------------------------------
  // 💼 Expériences
  // -------------------------------------------------------------
  async getExperiences(ref: string): Promise<CvExperience[]> {
    console.log(`Fetching experiences for entreprise ${ref}`);
    return [];
  }

  // -------------------------------------------------------------
  // 🎓 Formations
  // -------------------------------------------------------------
  async getEducation(ref: string): Promise<CvEducation[]> {
    console.log(`Fetching education for entreprise ${ref}`);
    return [];
  }

  // -------------------------------------------------------------
  // 🧩 CV complet
  // -------------------------------------------------------------
  async getFullCv(ref: string): Promise<{
    profile: CvProfile | null;
    skills: CvSkill[];
    experiences: CvExperience[];
    education: CvEducation[];
  }> {
    const [profile, skills, experiences, education] = await Promise.all([
      this.getProfile(ref),
      this.getSkills(ref),
      this.getExperiences(ref),
      this.getEducation(ref),
    ]);

    return { profile, skills, experiences, education };
  }
}
