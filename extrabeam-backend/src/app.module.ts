// src/app.module.ts
// -------------------------------------------------------------
// Module racine de l’application NestJS (AppModule)
// -------------------------------------------------------------
//
// 📌 Description :
//   - Point d’entrée principal du backend ExtraBeam
//   - Initialise et assemble les modules métiers (Auth, Profiles, Entreprises, etc.)
//   - Charge les variables d’environnement (.env) via ConfigModule
//
// 🧱 Architecture :
//   - Structure modulaire NestJS (chaque domaine = module indépendant)
//   - Modules communs injectables : Supabase, AuthCommon, Mailer
//   - Modules métiers : Auth, Profiles (puis Missions, Factures, etc.)
//
// 🔒 Sécurité :
//   - Variables sensibles chargées depuis `.env` (Supabase, Stripe, Brevo, JWT)
//   - ConfigModule global → disponible dans tout le backend
//
// ⚙️ Configuration :
//   - `ConfigModule.forRoot({ isGlobal: true })` : rend l’environnement global
//   - Les autres modules utilisent `process.env` directement ou via ConfigService
//
// -------------------------------------------------------------

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { SupabaseModule } from './common/supabase/supabase.module';
import { AuthCommonModule } from './common/auth/auth.module';
import { MailerModule } from './common/mailer/mailer.module';
import { AuthModule } from './auth/auth.module';
import { ProfilesModule } from './profiles/profiles.module';
import { EntreprisesModule } from './entreprises/entreprises.module';

@Module({
  imports: [
    // 🌍 Chargement global du .env
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // ⚙️ Modules communs
    SupabaseModule,
    AuthCommonModule,
    MailerModule,

    // 🧩 Modules métiers
    AuthModule,
    ProfilesModule,
    EntreprisesModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
