// src/entreprises/entreprises.controller.ts
// -------------------------------------------------------------
// Contrôleur : Entreprises
// -------------------------------------------------------------
//
// 📌 Description :
//   - Expose les endpoints HTTP principaux liés aux entreprises
//   - Routes publiques : liste + vue simple
//   - Routes hybrides : overview (publique ou propriétaire selon token)
//
// 📍 Endpoints :
//   - GET /api/entreprises
//   - GET /api/entreprises/:ref
//   - GET /api/entreprises/:ref/overview
//
// 🔒 Règles d’accès :
//   - Liste & vue simple accessibles publiquement
//   - Vue overview : enrichie pour owner/admin via JWT optionnel
//
// ⚠️ Remarques :
//   - Les sous-ressources (cv, slots, indisponibilités) sont gérées dans des contrôleurs dédiés
//   - Compatible avec le décorateur @User() (user nullable)
//
// -------------------------------------------------------------

import { Controller, Get, Param, UseGuards } from '@nestjs/common'

import type { AuthUser } from '../common/auth/auth.types'
import { User } from '../common/auth/decorators/user.decorator'
import { OptionalJwtAuthGuard } from '../common/auth/guards/optional-jwt.guard'
import {
  EntreprisesService,
  type EntrepriseDetail,
  type EntrepriseOverview,
  type PublicEntreprise,
} from './entreprises.service'

@Controller('entreprises')
export class EntreprisesController {
  constructor(private readonly entreprisesService: EntreprisesService) {}

  @Get()
  async listEntreprises(): Promise<{ entreprises: PublicEntreprise[] }> {
    return this.entreprisesService.getPublicEntreprises()
  }

  @Get(':ref')
  @UseGuards(OptionalJwtAuthGuard)
  async getEntreprise(
    @Param('ref') ref: string,
    @User() user: AuthUser | null,
  ): Promise<EntrepriseDetail> {
    return this.entreprisesService.getEntreprise(ref, user ?? null)
  }

  @Get(':ref/overview')
  @UseGuards(OptionalJwtAuthGuard)
  async getEntrepriseOverview(
    @Param('ref') ref: string,
    @User() user: AuthUser | null,
  ): Promise<EntrepriseOverview> {
    return this.entreprisesService.getEntrepriseOverview(ref, user ?? null)
  }
}
