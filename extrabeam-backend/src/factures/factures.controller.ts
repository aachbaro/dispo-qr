// src/factures/factures.controller.ts
// -------------------------------------------------------------
// Contrôleur : Factures
// -------------------------------------------------------------
//
// 📌 Description :
//   - Routes HTTP pour la gestion des factures
//   - Proxies vers `FacturesService`
//
// 📍 Endpoints :
//   - GET    /api/factures
//   - GET    /api/factures/:id
//   - POST   /api/factures
//   - PUT    /api/factures/:id
//   - POST   /api/factures/:id/send
//
// 🔒 Règles d’accès :
//   - Guards JwtAuthGuard pour toutes les routes
//   - Vérification fine côté service
//
// ⚠️ Remarques :
//   - Paramètre `entrepriseRef` pour filtrer la liste
//
// -------------------------------------------------------------

import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';

import type { AuthUser } from '../common/auth/auth.types';
import { User } from '../common/auth/decorators/user.decorator';
import { JwtAuthGuard } from '../common/auth/guards/jwt.guard';
import type { CreateFactureDto } from './dto/create-facture.dto';
import type { UpdateFactureDto } from './dto/update-facture.dto';
import { FacturesService } from './factures.service';

@Controller('factures')
@UseGuards(JwtAuthGuard)
export class FacturesController {
  constructor(private readonly facturesService: FacturesService) {}

  @Get()
  async listFactures(@Query('entrepriseRef') entrepriseRef: string, @User() user: AuthUser) {
    const factures = await this.facturesService.listFactures(entrepriseRef ?? '', user);
    return { factures };
  }

  @Get(':id')
  async getFacture(@Param('id', ParseIntPipe) id: number, @User() user: AuthUser) {
    const facture = await this.facturesService.getFacture(id, user);
    return { facture };
  }

  @Post()
  async createFacture(@Body() dto: CreateFactureDto, @User() user: AuthUser) {
    const facture = await this.facturesService.createFacture(dto, user);
    return { facture };
  }

  @Put(':id')
  async updateFacture(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFactureDto,
    @User() user: AuthUser,
  ) {
    const facture = await this.facturesService.updateFacture(id, dto, user);
    return { facture };
  }

  @Post(':id/send')
  async sendFacture(@Param('id', ParseIntPipe) id: number, @User() user: AuthUser) {
    return this.facturesService.sendFacture(id, user);
  }
}
