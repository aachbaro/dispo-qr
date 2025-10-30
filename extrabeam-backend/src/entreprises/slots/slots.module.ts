// src/entreprises/slots/slots.module.ts
// -------------------------------------------------------------
// Module : Entreprises › Slots
// -------------------------------------------------------------
//
// 📌 Description :
//   - Encapsule le contrôleur et le service liés aux disponibilités planifiées (slots)
//   - Facilite l’ajout futur de logique métier (validation, guards, etc.)
//
// 🔌 Composition :
//   - Controllers : SlotsController
//   - Providers  : SlotsService
//
// ⚠️ Remarques :
//   - Module initial sans endpoints concrets (prépare la refonte complète)
//
// -------------------------------------------------------------

import { Module } from '@nestjs/common';

import { SlotsController } from './slots.controller';
import { SlotsService } from './slots.service';

@Module({
  controllers: [SlotsController],
  providers: [SlotsService],
  exports: [SlotsService],
})
export class SlotsModule {}
