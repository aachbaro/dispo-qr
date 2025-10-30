// src/common/auth/jwt.strategy.ts
// -------------------------------------------------------------
// Stratégie JWT (Passport) pour l’authentification Supabase
// -------------------------------------------------------------
//
// 📌 Description :
//   - Valide les tokens JWT émis par Supabase Auth
//   - Charge le profil utilisateur complet depuis la base
//   - Injecte les métadonnées nécessaires (rôle, slug entreprise, etc.)
//
// 🧱 Architecture :
//   - Basé sur la stratégie Passport-JWT (`@nestjs/passport`)
//   - Utilise SupabaseService pour vérifier et enrichir l’utilisateur
//   - Appelé automatiquement par JwtAuthGuard pour protéger les routes
//
// 🔒 Sécurité :
//   - Vérifie la présence et validité du JWT_SECRET (.env obligatoire)
//   - Rejette tout token invalide, expiré ou sans profil associé
//
// ⚠️ Remarques :
//   - Le `slug` entreprise est ajouté uniquement pour les freelances
//   - Compatible avec `@User()` decorator pour injection automatique
//
// -------------------------------------------------------------

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import type { AuthUser } from './auth.types';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly supabaseService: SupabaseService) {
    const JWT_SECRET = process.env.JWT_SECRET ?? '';

    if (!JWT_SECRET) {
      throw new Error('❌ JWT_SECRET non défini — ajoutez-le dans le fichier .env');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET,
    });
  }

  /**
   * ✅ Validation du token Supabase + enrichissement utilisateur
   */
  async validate(payload: any): Promise<AuthUser> {
    const userId = payload?.sub;
    if (!userId) {
      throw new UnauthorizedException('Token Supabase invalide (missing sub)');
    }

    const admin = this.supabaseService.getAdminClient();

    // 🔍 Lecture du profil lié à l’utilisateur
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('role, first_name, last_name, phone')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      throw new UnauthorizedException(`Erreur profil Supabase: ${profileError.message}`);
    }

    // 🏢 Si freelance → on récupère le slug entreprise
    let slug: string | null = null;
    if (profile?.role === 'freelance') {
      const { data: entreprise, error: entrepriseError } = await admin
        .from('entreprise')
        .select('slug')
        .eq('user_id', userId)
        .maybeSingle();

      if (entrepriseError) {
        throw new UnauthorizedException(`Erreur entreprise Supabase: ${entrepriseError.message}`);
      }

      slug = entreprise?.slug ?? null;
    }

    // 🧩 Structure finale renvoyée à Nest (injectée via @User())
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
