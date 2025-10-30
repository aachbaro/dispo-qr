// src/payments/payments.module.ts
// -------------------------------------------------------------
// Module : Paiements
// -------------------------------------------------------------

import { Module, forwardRef } from '@nestjs/common';

import { AuthCommonModule } from '../common/auth/auth.module';
import { SupabaseModule } from '../common/supabase/supabase.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [SupabaseModule, AuthCommonModule, forwardRef(() => NotificationsModule)],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
