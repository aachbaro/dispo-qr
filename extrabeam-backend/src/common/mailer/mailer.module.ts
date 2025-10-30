import { Global, Module } from '@nestjs/common';

import { EmailTemplatesService } from './email-templates.service';
import { MailerService } from './mailer.service';
import { NotificationsService } from './notifications.service';

@Global()
@Module({
  providers: [MailerService, EmailTemplatesService, NotificationsService],
  exports: [MailerService, EmailTemplatesService, NotificationsService],
})
export class MailerModule {}
