// src/mission-templates/mission-templates.controller.ts
// -------------------------------------------------------------
// Contrôleur : Mission Templates
// -------------------------------------------------------------

import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';

import type { AuthUser } from '../common/auth/auth.types';
import { User } from '../common/auth/decorators/user.decorator';
import { JwtAuthGuard } from '../common/auth/guards/jwt.guard';
import type { CreateTemplateDto } from './dto/create-template.dto';
import type { UpdateTemplateDto } from './dto/update-template.dto';
import { MissionTemplatesService } from './mission-templates.service';

@Controller('mission-templates')
@UseGuards(JwtAuthGuard)
export class MissionTemplatesController {
  constructor(private readonly missionTemplatesService: MissionTemplatesService) {}

  @Get()
  async list(@User() user: AuthUser) {
    return this.missionTemplatesService.listTemplates(user);
  }

  @Post()
  async create(@Body() dto: CreateTemplateDto, @User() user: AuthUser) {
    return this.missionTemplatesService.createTemplate(dto, user);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTemplateDto,
    @User() user: AuthUser,
  ) {
    return this.missionTemplatesService.updateTemplate(id, dto, user);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @User() user: AuthUser) {
    return this.missionTemplatesService.deleteTemplate(id, user);
  }
}
