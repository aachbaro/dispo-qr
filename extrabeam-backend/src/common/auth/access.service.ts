import { Injectable, NotFoundException } from '@nestjs/common';

import type { Database } from '../../types/database';
import { SupabaseService } from '../supabase/supabase.service';
import type { AuthUser } from './auth.types';

type Table<Name extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][Name]['Row'];

type EntrepriseRow = Table<'entreprise'>;

@Injectable()
export class AccessService {
  constructor(private readonly supabase: SupabaseService) {}

  resolveEntrepriseRef(
    user: AuthUser,
    ref?: string | number | null,
  ): string | null {
    const normalizedRef =
      typeof ref === 'string' ? ref.trim() : ref ?? null;
    const resolved =
      normalizedRef !== null && normalizedRef !== ''
        ? normalizedRef
        : user.slug ?? user.id ?? null;
    return resolved === null ? null : String(resolved);
  }

  async findEntreprise(ref: string): Promise<EntrepriseRow> {
    const admin = this.supabase.getAdminClient();
    const baseQuery = admin
      .from('entreprise')
      .select('*')
      .returns<EntrepriseRow[]>();
    const query = ref.match(/^[0-9]+$/)
      ? baseQuery.eq('id', Number(ref)).maybeSingle()
      : baseQuery.eq('slug', ref).maybeSingle();

    const { data, error } = await query;
    if (error || !data) {
      throw new NotFoundException('Entreprise non trouvée');
    }
    return data;
  }

  canAccessEntreprise(user: AuthUser | null, entreprise: EntrepriseRow): boolean {
    if (!user) {
      return false;
    }
    if (user.role === 'admin') {
      return true;
    }
    return user.id === entreprise.user_id;
  }
}
