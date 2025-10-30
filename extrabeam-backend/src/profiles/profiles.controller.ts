import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../common/auth/guards/jwt.guard';
import { RolesGuard } from '../common/auth/guards/roles.guard';
import { User } from '../common/auth/decorators/user.decorator';
import type { AuthUser } from '../common/auth/auth.types';
import { ProfilesService } from './profiles.service';

@Controller('profiles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  async getMe(@User() user: AuthUser) {
    return this.profilesService.getProfile(user);
  }

  @Put('me')
  async updateMe(@User() user: AuthUser, @Body() body: any) {
    return this.profilesService.upsertProfile(user, body);
  }
}
