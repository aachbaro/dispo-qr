// src/notifications/notifications.module.ts
// -------------------------------------------------------------
// Module : Notifications
// -------------------------------------------------------------

import { Module, forwardRef } from '@nestjs/common';

import { AuthCommonModule } from '../common/auth/auth.module';
import { MailerModule } from '../common/mailer/mailer.module';
import { SupabaseModule } from '../common/supabase/supabase.module';
import { FacturesModule } from '../factures/factures.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [SupabaseModule, AuthCommonModule, MailerModule, forwardRef(() => FacturesModule)],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
