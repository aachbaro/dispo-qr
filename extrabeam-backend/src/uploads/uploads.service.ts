// src/uploads/uploads.service.ts
// -------------------------------------------------------------
// Service : Uploads (Supabase Storage)
// -------------------------------------------------------------

import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';

import { SupabaseService } from '../common/supabase/supabase.service';

@Injectable()
export class UploadsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getPublicUrl(bucket: string, path: string) {
    if (!bucket || !path) {
      throw new BadRequestException('Bucket et path requis');
    }

    const client = this.supabaseService.getAdminClient();
    const result = client.storage
      .from(bucket)
      .getPublicUrl(path) as { data: { publicUrl: string }; error: { message: string } | null };
    if (result.error) {
      throw new InternalServerErrorException(result.error.message);
    }

    return { publicUrl: result.data.publicUrl };
  }

  async createSignedUploadUrl(bucket: string, path: string) {
    if (!bucket || !path) {
      throw new BadRequestException('Bucket et path requis');
    }

    const client = this.supabaseService.getAdminClient();
    const { data, error } = (await client.storage
      .from(bucket)
      .createSignedUploadUrl(path, { expiresIn: 60 * 60 })) as {
      data: { signedUrl: string; token: string } | null;
      error: { message: string } | null;
    };
    if (error || !data) {
      throw new InternalServerErrorException(error?.message ?? 'Impossible de générer le lien');
    }

    return { url: data.signedUrl, token: data.token };
  }
}
