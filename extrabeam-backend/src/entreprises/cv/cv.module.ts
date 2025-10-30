// src/entreprises/cv/cv.module.ts
// -------------------------------------------------------------
// Module : Entreprises › CV
// -------------------------------------------------------------
//
// 📌 Description :
//   - Regroupe les contrôleurs et services liés à la gestion du CV freelance
//   - Prépare l’implémentation future des endpoints CV, expériences, formations, compétences
//
// 🔌 Composition :
//   - Controllers : CvController, ExperiencesController, EducationController, SkillsController
//   - Providers  : CvService
//
// ⚠️ Remarques :
//   - Module déclaré indépendamment pour simplifier l’extension future (guards, pipes, etc.)
//
// -------------------------------------------------------------

import { Module } from '@nestjs/common';

import { CvController } from './cv.controller';
import { CvService } from './cv.service';
import { EducationController } from './education.controller';
import { ExperiencesController } from './experiences.controller';
import { SkillsController } from './skills.controller';

@Module({
  controllers: [CvController, ExperiencesController, EducationController, SkillsController],
  providers: [CvService],
  exports: [CvService],
})
export class CvModule {}
