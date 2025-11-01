import { Module } from '@nestjs/common'

import { AccessService } from '../../common/auth/access.service'
import { SupabaseService } from '../../common/supabase/supabase.service'
import { CvController } from './cv.controller'
import { CvService } from './cv.service'

@Module({
  controllers: [CvController],
  providers: [CvService, SupabaseService, AccessService],
  exports: [CvService],
})
export class CvModule {}
