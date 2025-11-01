// src/notifications/notifications.controller.ts
// -------------------------------------------------------------
// Contrôleur : Notifications
// -------------------------------------------------------------

import { Controller, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common'

import type { AuthUser } from '../common/auth/auth.types'
import { User } from '../common/auth/decorators/user.decorator'
import { JwtAuthGuard } from '../common/auth/guards/jwt.guard'
import { NotificationsService } from './notifications.service'

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('mission/:id/sent')
  async missionSent(
    @Param('id', ParseIntPipe) id: number,
    @User() user: AuthUser,
  ): Promise<{ sent: true }> {
    return this.notificationsService.sendMissionNotification(id, user)
  }

  @Post('facture/:id/sent')
  async factureSent(
    @Param('id', ParseIntPipe) id: number,
    @User() user: AuthUser,
  ): Promise<{ sent: true }> {
    return this.notificationsService.sendFactureNotification(id, user)
  }
}
