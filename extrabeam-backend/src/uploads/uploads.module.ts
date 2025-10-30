// src/uploads/uploads.module.ts
// -------------------------------------------------------------
// Module : Uploads
// -------------------------------------------------------------

import { Module } from '@nestjs/common';

import { SupabaseModule } from '../common/supabase/supabase.module';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

@Module({
  imports: [SupabaseModule],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
