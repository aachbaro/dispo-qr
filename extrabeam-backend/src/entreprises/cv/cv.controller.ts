import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common'

import { CvService } from './cv.service'
import { JwtAuthGuard } from '../../common/auth/guards/jwt.guard'
import { RolesGuard } from '../../common/auth/guards/roles.guard'
import { User } from '../../common/auth/decorators/user.decorator'
import type { AuthUser } from '../../common/auth/auth.types'
import type { Database } from '../../types/database'

type CvProfile = Database['public']['Tables']['cv_profiles']['Row']
type CvSkill = Database['public']['Tables']['cv_skills']['Row']
type CvExperience = Database['public']['Tables']['cv_experiences']['Row']
type CvEducation = Database['public']['Tables']['cv_education']['Row']

@Controller('entreprises/:ref/cv')
export class CvController {
  constructor(private readonly cvService: CvService) {}

  @Get()
  async getFullCv(
    @Param('ref') ref: string,
  ): Promise<{
    profile: CvProfile | null
    skills: CvSkill[]
    experiences: CvExperience[]
    education: CvEducation[]
  }> {
    const [profile, skills, experiences, education] = await Promise.all([
      this.cvService.getProfile(ref),
      this.cvService.getSkills(ref),
      this.cvService.getExperiences(ref),
      this.cvService.getEducation(ref),
    ])

    return { profile, skills, experiences, education }
  }

  @Get('profile')
  async getProfile(@Param('ref') ref: string): Promise<CvProfile | null> {
    return this.cvService.getProfile(ref)
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async updateProfile(
    @Param('ref') ref: string,
    @User() user: AuthUser,
    @Body() dto: Partial<CvProfile>,
  ): Promise<CvProfile> {
    return this.cvService.updateProfile(ref, dto, user)
  }

  @Get('skills')
  async getSkills(@Param('ref') ref: string): Promise<CvSkill[]> {
    return this.cvService.getSkills(ref)
  }

  @Get('experiences')
  async getExperiences(@Param('ref') ref: string): Promise<CvExperience[]> {
    return this.cvService.getExperiences(ref)
  }

  @Get('education')
  async getEducation(@Param('ref') ref: string): Promise<CvEducation[]> {
    return this.cvService.getEducation(ref)
  }
}
