// src/uploads/uploads.service.ts
// -------------------------------------------------------------
// Service : Uploads (Supabase Storage)
// -------------------------------------------------------------
//
// 📌 Description :
//   - Gère la génération d’URL d’accès ou d’upload temporaire vers Supabase Storage.
//   - Permet au frontend d’uploader des fichiers (logos, factures, images de profil…)
//     sans exposer la clé `SERVICE_ROLE`.
//
// 📍 Endpoints (via UploadsController) :
//   - POST /api/uploads/public-url → getPublicUrl()
//   - POST /api/uploads/put-signed-url → createSignedUploadUrl()
//
// 🔒 Règles d’accès :
//   - Protégé par JwtAuthGuard (user authentifié requis).
//   - Les fichiers sont ensuite accessibles selon le bucket Supabase (public/privé).
//
// ⚙️ Notes :
//   - Compatible Supabase JS v2.x (pas de paramètre `expiresIn`).
//   - Les URLs signées expirent automatiquement (durée fixée côté serveur Supabase).
//
// -------------------------------------------------------------

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';

@Injectable()
export class UploadsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  // -------------------------------------------------------------
  // 📄 getPublicUrl()
  // -------------------------------------------------------------
  // Retourne l’URL publique d’un fichier déjà uploadé
  // (si le bucket est configuré en "public" côté Supabase)
  // -------------------------------------------------------------
  async getPublicUrl(bucket: string, path: string) {
    if (!bucket || !path) {
      throw new BadRequestException('Bucket et path requis');
    }

    const client = this.supabaseService.getAdminClient();
    const result = client.storage
      .from(bucket)
      .getPublicUrl(path) as {
        data: { publicUrl: string };
        error: { message: string } | null;
      };

    if (result.error) {
      throw new InternalServerErrorException(result.error.message);
    }

    return { publicUrl: result.data.publicUrl };
  }

  // -------------------------------------------------------------
  // 📤 createSignedUploadUrl()
  // -------------------------------------------------------------
  // Crée une URL temporaire signée permettant l’upload direct
  // depuis le frontend (sans exposer la clé admin).
  //
  // ⚠️ Compatibilité Supabase v2.x : pas de paramètre expiresIn.
  // -------------------------------------------------------------
  async createSignedUploadUrl(bucket: string, path: string) {
    if (!bucket || !path) {
      throw new BadRequestException('Bucket et path requis');
    }

    const client = this.supabaseService.getAdminClient();
    const { data, error } = (await client.storage
      .from(bucket)
      .createSignedUploadUrl(path)) as {
      data: { signedUrl: string; token: string } | null;
      error: { message: string } | null;
    };

    if (error || !data) {
      throw new InternalServerErrorException(
        error?.message ?? 'Impossible de générer le lien signé',
      );
    }

    return { url: data.signedUrl, token: data.token };
  }
}
