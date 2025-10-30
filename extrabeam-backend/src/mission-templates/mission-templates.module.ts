// src/mission-templates/mission-templates.module.ts
// -------------------------------------------------------------
// Module : Mission Templates
// -------------------------------------------------------------

import { Module } from '@nestjs/common';

import { MissionTemplatesController } from './mission-templates.controller';
import { MissionTemplatesService } from './mission-templates.service';

@Module({
  controllers: [MissionTemplatesController],
  providers: [MissionTemplatesService],
  exports: [MissionTemplatesService],
})
export class MissionTemplatesModule {}
