// src/entreprises/entreprises.module.ts
// -------------------------------------------------------------
// Module : Entreprises
// -------------------------------------------------------------
//
// 📌 Description :
//   - Assemble le domaine Entreprises autour de son contrôleur principal
//   - Agrège les sous-modules CV, Slots et Indisponibilités (structure évolutive)
//   - S’appuie sur les modules communs (Supabase, Auth, Mailer)
//
// 🔌 Composition :
//   - Imports : AuthCommonModule, CvModule, SlotsModule, UnavailabilitiesModule
//   - Controllers : EntreprisesController
//   - Providers  : EntreprisesService
//
// ⚠️ Remarques :
//   - Les sous-modules exposent pour l’instant des squelettes en attente de migration complète
//   - Module importé dans AppModule pour exposer les endpoints `/api/entreprises/*`
//
// -------------------------------------------------------------

import { Module } from '@nestjs/common';

import { AuthCommonModule } from '../common/auth/auth.module';
import { CvModule } from './cv';
import { EntreprisesController } from './entreprises.controller';
import { EntreprisesService } from './entreprises.service';
import { SlotsModule } from './slots';
import { UnavailabilitiesModule } from './unavailabilities';

@Module({
  imports: [AuthCommonModule, CvModule, SlotsModule, UnavailabilitiesModule],
  controllers: [EntreprisesController],
  providers: [EntreprisesService],
})
export class EntreprisesModule {}
