import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import type { AuthUser } from './auth.types';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly supabaseService: SupabaseService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is required to validate Supabase tokens');
    }
  }

  async validate(payload: any): Promise<AuthUser> {
    const userId = payload?.sub;
    if (!userId) {
      throw new UnauthorizedException('Invalid Supabase token');
    }

    const admin = this.supabaseService.getAdminClient();

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('role, first_name, last_name, phone')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      throw new UnauthorizedException(profileError.message);
    }

    let slug: string | null = null;
    if (profile?.role === 'freelance') {
      const { data: entreprise, error: entrepriseError } = await admin
        .from('entreprise')
        .select('slug')
        .eq('user_id', userId)
        .maybeSingle();

      if (entrepriseError) {
        throw new UnauthorizedException(entrepriseError.message);
      }

      slug = entreprise?.slug ?? null;
    }

    return {
      id: userId,
      email: payload?.email ?? null,
      role: profile?.role ?? payload?.role ?? null,
      first_name: profile?.first_name ?? null,
      last_name: profile?.last_name ?? null,
      phone: profile?.phone ?? null,
      slug,
    };
  }
}
