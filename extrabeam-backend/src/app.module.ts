import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';
import { AuthCommonModule } from './common/auth/auth.module';
import { MailerModule } from './common/mailer/mailer.module';
import { SupabaseModule } from './common/supabase/supabase.module';
import { ProfilesModule } from './profiles/profiles.module';

@Module({
  imports: [SupabaseModule, AuthCommonModule, MailerModule, AuthModule, ProfilesModule],
})
export class AppModule {}
