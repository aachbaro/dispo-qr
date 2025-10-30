// src/auth/auth.service.ts
// -------------------------------------------------------------
// Service : Authentification et Gestion Utilisateur
// -------------------------------------------------------------
//
// 📌 Description :
//   - Gère les opérations d'authentification via Supabase (login / logout)
//   - Permet la création de compte (register) pour freelances et clients
//   - Fournit les informations du profil utilisateur (`getMe`)
//   - Crée automatiquement l’entreprise liée au compte freelance
//
// 🧱 Architecture :
//   - Utilise SupabaseService pour communiquer avec la DB
//   - Reste indépendant de la couche HTTP (contrôleur AuthController)
//   - Applique les conventions NestJS (services injectables, typage strict)
//
// 🔒 Sécurité :
//   - Validation des entrées (`BadRequestException`, `UnauthorizedException`)
//   - Isolation des rôles (freelance / client)
//
// -------------------------------------------------------------

import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';
import type { TablesInsert } from '../common/types/database';
import type { AuthUser } from '../common/auth/auth.types';
import type { LoginDto } from './dto/login.dto';
import type { EntreprisePayload, RegisterDto } from './dto/register.dto';

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
    slug: string | null;
    nom: string | null;
    prenom: string | null;
  };
}

/**
 * Service responsable de l’authentification, de l’inscription
 * et de la gestion du profil utilisateur.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly supabase: SupabaseService) {}

  // -------------------------
  // 🔹 UTILITAIRES PRIVÉS
  // -------------------------

  private normalizeSlugSource(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  private async generateUniqueSlug(nom: string, prenom: string): Promise<string> {
    const base = this.normalizeSlugSource(`${prenom}-${nom}`);
    const admin = this.supabase.getAdminClient();

    let slug = base;
    let i = 1;

    while (true) {
      const { data, error } = await admin
        .from('entreprise')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw new BadRequestException('Erreur vérification du slug');
      if (!data) break;
      slug = `${base}-${i++}`;
    }

    return slug;
  }

  private buildEntrepriseInsert(
    userId: string,
    email: string,
    entreprise: EntreprisePayload,
  ): TablesInsert<'entreprise'> {
    return {
      user_id: userId,
      nom: entreprise.nom ?? '',
      prenom: entreprise.prenom ?? '',
      slug: '',
      adresse_ligne1: entreprise.adresse_ligne1 ?? '',
      adresse_ligne2: entreprise.adresse_ligne2 ?? null,
      ville: entreprise.ville ?? null,
      code_postal: entreprise.code_postal ?? null,
      pays: entreprise.pays ?? null,
      email,
      telephone: entreprise.telephone ?? null,
      siret: entreprise.siret ?? '',
      statut_juridique: entreprise.statut_juridique ?? 'micro-entreprise',
      tva_intracom: entreprise.tva_intracom ?? null,
      mention_tva: entreprise.mention_tva ?? 'TVA non applicable, art. 293 B du CGI',
      iban: entreprise.iban ?? '',
      bic: entreprise.bic ?? '',
      taux_horaire: entreprise.taux_horaire ?? 20,
      devise: entreprise.devise ?? 'EUR',
      conditions_paiement:
        entreprise.conditions_paiement ?? 'Paiement comptant à réception',
      penalites_retard:
        entreprise.penalites_retard ??
        'Taux BCE + 10 pts, indemnité forfaitaire 40 €',
    };
  }

  // -------------------------
  // 🔹 MÉTHODES PUBLIQUES
  // -------------------------

  /**
   * Authentifie un utilisateur via Supabase.
   */
  async login({ email, password }: LoginDto): Promise<AuthResponse> {
    if (!email || !password) {
      throw new BadRequestException('Email et mot de passe requis');
    }

    const client = this.supabase.getPublicClient();
    const { data, error } = await client.auth.signInWithPassword({ email, password });

    if (error || !data.user || !data.session) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const { user, session } = data;

    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('role, first_name, last_name')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) throw new BadRequestException(profileError.message);

    const role = profile?.role ?? user.user_metadata?.role ?? 'client';

    let entreprise: { slug: string | null; nom: string | null; prenom: string | null } | null =
      null;

    if (role === 'freelance') {
      const { data: ent, error: entError } = await client
        .from('entreprise')
        .select('slug, nom, prenom')
        .eq('user_id', user.id)
        .maybeSingle();

      if (entError) throw new BadRequestException(entError.message);
      entreprise = ent ?? null;
    }

    return {
      token: session.access_token,
      user: {
        id: user.id,
        email: user.email ?? '',
        role,
        slug: entreprise?.slug ?? null,
        nom: entreprise?.nom ?? null,
        prenom: entreprise?.prenom ?? null,
      },
    };
  }

  /**
   * Crée un utilisateur dans Supabase + son profil + son entreprise si freelance.
   */
  async register(payload: RegisterDto) {
    const { email, password, role, entreprise } = payload;

    if (!email || !password || !role)
      throw new BadRequestException('Champs obligatoires manquants');

    if (!['freelance', 'client'].includes(role))
      throw new BadRequestException('Rôle invalide');

    const admin = this.supabase.getAdminClient();

    // Création du compte utilisateur
    const { data: createUserResult, error: signUpError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (signUpError || !createUserResult?.user)
      throw new BadRequestException(signUpError?.message ?? 'Erreur création utilisateur');

    const user = createUserResult.user;

    // Création du profil
    const profileData: TablesInsert<'profiles'> = {
      id: user.id,
      email,
      role,
      first_name: entreprise?.prenom ?? null,
      last_name: entreprise?.nom ?? null,
    };

    const { error: profileError } = await admin.from('profiles').insert(profileData);
    if (profileError) throw new BadRequestException('Erreur création profil');

    let createdEntreprise: any = null;

    if (role === 'freelance') {
      if (!entreprise?.nom || !entreprise?.prenom)
        throw new BadRequestException('Nom et prénom requis');

      const slug = await this.generateUniqueSlug(entreprise.nom, entreprise.prenom);
      const entrepriseData = this.buildEntrepriseInsert(user.id, email, entreprise);
      entrepriseData.slug = slug;

      const { data: ent, error: entError } = await admin
        .from('entreprise')
        .insert(entrepriseData)
        .select()
        .single();

      if (entError) throw new BadRequestException(entError.message);

      createdEntreprise = ent;
    }

    return {
      user: {
        id: user.id,
        email,
        role,
        slug: createdEntreprise?.slug ?? null,
      },
      profile: {
        id: user.id,
        role,
        first_name: entreprise?.prenom ?? null,
        last_name: entreprise?.nom ?? null,
      },
      entreprise: createdEntreprise,
    };
  }

  /**
   * Récupère les informations d’un utilisateur connecté.
   */
  async getMe(user: AuthUser) {
    const admin = this.supabase.getAdminClient();

    let finalUser: AuthUser = { ...user };

    if (!finalUser.role || !finalUser.first_name || !finalUser.last_name) {
      const { data: profile } = await admin
        .from('profiles')
        .select('role, first_name, last_name, phone')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        finalUser = {
          ...finalUser,
          role: profile.role ?? finalUser.role,
          first_name: profile.first_name ?? finalUser.first_name,
          last_name: profile.last_name ?? finalUser.last_name,
          phone: profile.phone ?? finalUser.phone,
        };
      }
    }

    if (finalUser.role === 'freelance' && !finalUser.slug) {
      const { data: entreprise } = await admin
        .from('entreprise')
        .select('slug')
        .eq('user_id', user.id)
        .maybeSingle();

      if (entreprise?.slug) finalUser.slug = entreprise.slug;
    }

    return { user: finalUser };
  }

  /**
   * Déconnecte un utilisateur (invalidate Supabase session).
   */
  async logout(token: string) {
    if (!token) throw new UnauthorizedException('Non authentifié');

    const admin = this.supabase.getAdminClient();
    const { error } = await admin.auth.admin.signOut(token);

    if (error) this.logger.warn(`Erreur signOut : ${error.message}`);

    return { message: '✅ Déconnecté avec succès' };
  }
}
