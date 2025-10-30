import { Injectable } from '@nestjs/common';

import type { Tables } from '../types/database';
import { SupabaseService } from '../supabase/supabase.service';
import type { AuthUser } from './auth.types';

@Injectable()
export class AccessService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findEntreprise(ref: string | number) {
    const client = this.supabaseService.getAdminClient();
    let query = client.from('entreprise').select('*');

    if (typeof ref === 'number' || !Number.isNaN(Number(ref))) {
      query = query.eq('id', Number(ref));
    } else if (typeof ref === 'string') {
      if (/^[0-9a-fA-F-]{8}-[0-9a-fA-F-]{4}-/.test(ref)) {
        query = query.eq('user_id', ref);
      } else {
        query = query.eq('slug', ref);
      }
    }

    const { data, error } = await query.single<Tables<'entreprise'>>();
    if (error) {
      throw error;
    }

    return data;
  }

  canAccessEntreprise(user: AuthUser | null, entreprise: Tables<'entreprise'>): boolean {
    if (!user || !entreprise) {
      return false;
    }

    if (entreprise.user_id === user.id) {
      return true;
    }

    if (user.role === 'admin') {
      return true;
    }

    return false;
  }
}
