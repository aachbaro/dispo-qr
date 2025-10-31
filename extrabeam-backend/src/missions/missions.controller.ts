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
} from '@nestjs/common'

import type { AuthUser } from '../common/auth/auth.types'
import { User } from '../common/auth/decorators/user.decorator'
import { JwtAuthGuard } from '../common/auth/guards/jwt.guard'
import type { Database } from '../types/database'
import { MissionCreateDto } from './dto/mission-create.dto'
import { MissionUpdateDto } from './dto/mission-update.dto'
import { MissionUpdateStatusDto } from './dto/update-mission-status.dto'
import { MissionsService, type MissionWithRelations } from './missions.service'

type Enum<Name extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][Name]

type Table<Name extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][Name]['Row']

type MissionStatus = Enum<'mission_status'>
type MissionRow = Table<'missions'>

@Controller('missions')
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async listMissions(
    @Query('entrepriseRef') entrepriseRef: string | undefined,
    @Query('week') week: string | undefined,
    @Query('status') status: MissionStatus | undefined,
    @Query('page') page?: string,
    @Query('size') size?: string,
    @User() user?: AuthUser | null,
  ): Promise<{ missions: MissionWithRelations[] }> {
    const missions = await this.missionsService.listMissions(
      {
        entrepriseRef: entrepriseRef ?? undefined,
        week: week ?? undefined,
        status: status ?? undefined,
        page: page ? Number(page) : undefined,
        size: size ? Number(size) : undefined,
      },
      user ?? null,
    )

    return { missions }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getMission(
    @Param('id', ParseIntPipe) id: number,
    @User() user?: AuthUser | null,
  ): Promise<{ mission: MissionWithRelations }> {
    const mission = await this.missionsService.getMission(id, user ?? null)
    return { mission }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createMission(
    @Body() dto: MissionCreateDto,
    @User() user?: AuthUser | null,
  ): Promise<{ mission: MissionRow }> {
    const mission = await this.missionsService.createMission(dto, user ?? null)
    return { mission }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateMission(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MissionUpdateDto,
    @User() user?: AuthUser | null,
  ): Promise<{ mission: MissionWithRelations }> {
    const mission = await this.missionsService.updateMission(id, dto, user ?? null)
    return { mission }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteMission(
    @Param('id', ParseIntPipe) id: number,
    @User() user?: AuthUser | null,
  ): Promise<{ success: true }> {
    await this.missionsService.deleteMission(id, user ?? null)
    return { success: true }
  }

  @Post(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MissionUpdateStatusDto,
    @User() user?: AuthUser | null,
  ): Promise<{ mission: MissionRow }> {
    const mission = await this.missionsService.updateMissionStatus(
      id,
      dto.status,
      user ?? null,
    )
    return { mission }
  }
}
