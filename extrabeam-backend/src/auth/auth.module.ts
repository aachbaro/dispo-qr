import { Module } from '@nestjs/common';

import { AuthCommonModule } from '../common/auth/auth.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [AuthCommonModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
