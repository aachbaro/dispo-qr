import { Global, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { SupabaseModule } from '../supabase/supabase.module';
import { AccessService } from './access.service';
import { JwtStrategy } from './jwt.strategy';

@Global()
@Module({
  imports: [PassportModule, SupabaseModule],
  providers: [JwtStrategy, AccessService],
  exports: [PassportModule, JwtStrategy, AccessService],
})
export class AuthCommonModule {}
