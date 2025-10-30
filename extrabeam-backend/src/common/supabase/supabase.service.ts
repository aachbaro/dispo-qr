import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../types/database';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private readonly adminClient: SupabaseClient<Database>;
  private readonly publicClient: SupabaseClient<Database>;

  constructor() {
    const url = process.env.SUPABASE_URL ?? '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
    const anonKey = process.env.SUPABASE_ANON_KEY ?? '';

    if (!url) {
      throw new Error('SUPABASE_URL is required');
    }
    if (!serviceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
    }
    if (!anonKey) {
      this.logger.warn('SUPABASE_ANON_KEY is missing – JWT verification may fail');
    }

    this.adminClient = createClient<Database>(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    this.publicClient = createClient<Database>(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  getAdminClient(): SupabaseClient<Database> {
    return this.adminClient;
  }

  getPublicClient(): SupabaseClient<Database> {
    return this.publicClient;
  }
}
