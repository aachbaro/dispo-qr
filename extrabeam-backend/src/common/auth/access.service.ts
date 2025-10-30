import { Injectable, NotFoundException } from '@nestjs/common';

import type { Tables } from '../types/database';
import { SupabaseService } from '../supabase/supabase.service';
import type { AuthUser } from './auth.types';

@Injectable()
export class AccessService {
  constructor(private readonly supabase: SupabaseService) {}

  async findEntreprise(ref: string): Promise<Tables<'entreprise'>> {
    const admin = this.supabase.getAdminClient();
    const query = ref.match(/^[0-9]+$/)
      ? admin.from('entreprise').select('*').eq('id', Number(ref)).maybeSingle<Tables<'entreprise'>>()
      : admin.from('entreprise').select('*').eq('slug', ref).maybeSingle<Tables<'entreprise'>>();

    const { data, error } = await query;
    if (error || !data) {
      throw new NotFoundException('Entreprise non trouvée');
    }
    return data;
  }

  canAccessEntreprise(user: AuthUser | null, entreprise: Tables<'entreprise'>): boolean {
    if (!user) {
      return false;
    }
    if (user.role === 'admin') {
      return true;
    }
    return user.id === entreprise.user_id;
  }
}
