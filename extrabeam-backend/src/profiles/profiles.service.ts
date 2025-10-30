import { BadRequestException, Injectable } from '@nestjs/common';

import type { Tables, TablesInsert } from '../common/types/database';
import type { AuthUser } from '../common/auth/auth.types';
import { SupabaseService } from '../common/supabase/supabase.service';

@Injectable()
export class ProfilesService {
  constructor(private readonly supabase: SupabaseService) {}

  private normalizeSlugSource(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  private async generateUniqueSlug(firstName: string, lastName: string) {
    const base = this.normalizeSlugSource(`${firstName}-${lastName}`);
    const admin = this.supabase.getAdminClient();
    let slug = base;
    let i = 1;

    while (true) {
      const { data, error } = await admin
        .from('entreprise')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (error) {
        throw new BadRequestException('Erreur vérification slug');
      }
      if (!data) {
        break;
      }
      slug = `${base}-${i++}`;
    }

    return slug;
  }

  async getProfile(user: AuthUser) {
    const admin = this.supabase.getAdminClient();
    const { data: profile, error } = await admin
      .from('profiles')
      .select('id, email, role, first_name, last_name, phone, created_at')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      throw new BadRequestException(error.message);
    }

    let slug: string | null = null;
    if (profile?.role === 'freelance') {
      const { data: entreprise } = await admin
        .from('entreprise')
        .select('slug')
        .eq('user_id', user.id)
        .maybeSingle();
      slug = entreprise?.slug ?? null;
    }

    return {
      profile: {
        id: user.id,
        email: user.email,
        role: profile?.role ?? null,
        first_name: profile?.first_name ?? null,
        last_name: profile?.last_name ?? null,
        phone: profile?.phone ?? null,
        slug,
        created_at: profile?.created_at ?? null,
      },
    };
  }

  async upsertProfile(user: AuthUser, payload: Partial<Tables<'profiles'>>) {
    const admin = this.supabase.getAdminClient();
    const { role, first_name, last_name, phone } = payload;

    if (!role) {
      throw new BadRequestException("Champ 'role' obligatoire");
    }

    const { data: existingProfile } = await admin
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    const profileData: Partial<Tables<'profiles'>> = {
      id: user.id,
      email: user.email,
      role,
      first_name,
      last_name,
      phone,
    };

    if (!existingProfile) {
      const { error: insertError } = await admin.from('profiles').insert([profileData]);
      if (insertError) {
        throw new BadRequestException(insertError.message);
      }
    } else {
      const { error: updateError } = await admin
        .from('profiles')
        .update(profileData)
        .eq('id', user.id);
      if (updateError) {
        throw new BadRequestException(updateError.message);
      }
    }

    if (role === 'freelance') {
      const { data: existingEnt } = await admin
        .from('entreprise')
        .select('id, slug')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!existingEnt) {
        const slug = await this.generateUniqueSlug(first_name || 'extra', last_name || 'user');
        const entrepriseData: TablesInsert<'entreprise'> = {
          user_id: user.id,
          prenom: first_name || '',
          nom: last_name || '',
          email: user.email,
          slug,
          adresse_ligne1: 'à compléter',
          siret: '',
          iban: '',
          bic: '',
        };

        const { error: entError } = await admin.from('entreprise').insert([entrepriseData]);
        if (entError) {
          console.warn('⚠️ Erreur création entreprise:', entError.message);
        }
      }
    }

    if (role === 'client') {
      const { data: existingClient } = await admin
        .from('clients')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (!existingClient) {
        const clientData: TablesInsert<'clients'> = {
          id: user.id,
          role: 'client',
        };

        const { error: insertClientError } = await admin
          .from('clients')
          .insert([clientData]);

        if (insertClientError) {
          console.warn('⚠️ Erreur création client:', insertClientError.message);
        }
      }
    }

    return { profile: profileData };
  }
}
