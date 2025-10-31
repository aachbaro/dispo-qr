import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common'

import type { AuthUser } from '../common/auth/auth.types'
import { User } from '../common/auth/decorators/user.decorator'
import { JwtAuthGuard } from '../common/auth/guards/jwt.guard'
import { RolesGuard } from '../common/auth/guards/roles.guard'
import type { Database } from '../types/database'
import { ProfilesService, type ProfileSummary } from './profiles.service'

type Table<Name extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][Name]['Row']

type ProfileRow = Table<'profiles'>

type ProfileUpdateInput = Partial<Omit<ProfileRow, 'id' | 'created_at'>>

@Controller('profiles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  async getMe(@User() user: AuthUser): Promise<ProfileSummary> {
    return this.profilesService.getProfile(user)
  }

  @Put('me')
  async updateMe(
    @User() user: AuthUser,
    @Body() body: ProfileUpdateInput,
  ): Promise<ProfileSummary> {
    return this.profilesService.upsertProfile(user, body)
  }
}
