// src/missions/missions.controller.ts
// -------------------------------------------------------------
// Contrôleur : Missions
// -------------------------------------------------------------
//
// 📌 Description :
//   - Déclare les routes HTTP liées aux missions
//   - S'appuie sur `MissionsService` pour la logique métier
//
// 📍 Endpoints :
//   - GET    /api/missions
//   - GET    /api/missions/:id
//   - POST   /api/missions
//   - PUT    /api/missions/:id
//   - DELETE /api/missions/:id
//   - POST   /api/missions/:id/status
//
// 🔒 Règles d’accès :
//   - Lecture & mutations protégées par JwtAuthGuard (identique à l'API historique)
//   - Vérification fine dans le service via AccessService
//
// ⚠️ Remarques :
//   - Les DTO sont des interfaces TS (validation custom côté client)
//   - Le décorateur @User() fournit l'utilisateur authentifié (ou null)
//
// -------------------------------------------------------------

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import type { AuthUser } from '../common/auth/auth.types';
import { User } from '../common/auth/decorators/user.decorator';
import { JwtAuthGuard } from '../common/auth/guards/jwt.guard';
import type { Enums } from '../common/types/database';
import type { CreateMissionDto } from './dto/create-mission.dto';
import type { UpdateMissionDto } from './dto/update-mission.dto';
import type { UpdateMissionStatusDto } from './dto/update-mission-status.dto';
import { MissionsService } from './missions.service';

@Controller('missions')
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async listMissions(
    @Query('entrepriseRef') entrepriseRef: string | undefined,
    @Query('week') week: string | undefined,
    @Query('status') status: Enums<'mission_status'> | undefined,
    @Query('page') page?: string,
    @Query('size') size?: string,
    @User() user?: AuthUser | null,
  ) {
    return this.missionsService.getMissions(
      {
        entrepriseRef: entrepriseRef ?? undefined,
        week: week ?? undefined,
        status: status ?? undefined,
        page: page ? Number(page) : undefined,
        size: size ? Number(size) : undefined,
      },
      user ?? null,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getMission(@Param('id', ParseIntPipe) id: number, @User() user?: AuthUser | null) {
    return this.missionsService.getMissionById(id, user ?? null);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createMission(@Body() dto: CreateMissionDto, @User() user?: AuthUser | null) {
    const mission = await this.missionsService.createMission(dto, user ?? null);
    return { mission };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateMission(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMissionDto,
    @User() user?: AuthUser | null,
  ) {
    const mission = await this.missionsService.updateMission(id, dto, user ?? null);
    return { mission };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteMission(@Param('id', ParseIntPipe) id: number, @User() user?: AuthUser | null) {
    return this.missionsService.deleteMission(id, user ?? null);
  }

  @Post(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMissionStatusDto,
    @User() user?: AuthUser | null,
  ) {
    const mission = await this.missionsService.updateMissionStatus(id, dto.status, user ?? null);
    return { mission };
  }
}
