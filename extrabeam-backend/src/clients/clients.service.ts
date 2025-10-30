// src/clients/clients.service.ts
// -------------------------------------------------------------
// Service : Clients (entreprises)
// -------------------------------------------------------------
//
// 📌 Description :
//   - Gestion des relations entreprise ↔ clients via `client_contacts`
//   - Portage de la logique historique (attach/detach/list)
//
// 📍 Endpoints :
//   - GET    /api/clients
//   - POST   /api/clients/attach
//   - DELETE /api/clients/:id
//
// 🔒 Règles d’accès :
//   - Owner/admin entreprise uniquement (JwtAuthGuard)
//
// -------------------------------------------------------------

import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';

import type { AuthUser } from '../common/auth/auth.types';
import { AccessService } from '../common/auth/access.service';
import { SupabaseService } from '../common/supabase/supabase.service';
import type { AttachClientDto } from './dto/attach-client.dto';

@Injectable()
export class ClientsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly accessService: AccessService,
  ) {}

  private ensureOwner(user: AuthUser | null) {
    if (!user) {
      throw new BadRequestException('Authentification requise');
    }
    if (!['freelance', 'entreprise', 'admin'].includes(user.role ?? '')) {
      throw new ForbiddenException('Accès réservé aux entreprises');
    }
  }

  async listClients(entrepriseRef: string, user: AuthUser | null) {
    this.ensureOwner(user);
    const ref = entrepriseRef || user?.slug || user?.id;
    if (!ref) {
      throw new BadRequestException('Référence entreprise manquante');
    }

    const entreprise = await this.accessService.findEntreprise(String(ref));
    if (!this.accessService.canAccessEntreprise(user!, entreprise)) {
      throw new ForbiddenException('Accès interdit');
    }

    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('client_contacts')
      .select('id, created_at, client:client_id(*), entreprise:entreprise_id(*)')
      .eq('entreprise_id', entreprise.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return { contacts: data ?? [] };
  }

  async attachClient(entrepriseRef: string, dto: AttachClientDto, user: AuthUser | null) {
    this.ensureOwner(user);
    if (!dto?.client_id) {
      throw new BadRequestException('client_id requis');
    }

    const ref = entrepriseRef || user?.slug || user?.id;
    if (!ref) {
      throw new BadRequestException('Référence entreprise manquante');
    }

    const entreprise = await this.accessService.findEntreprise(String(ref));
    if (!this.accessService.canAccessEntreprise(user!, entreprise)) {
      throw new ForbiddenException('Accès interdit');
    }

    const admin = this.supabaseService.getAdminClient();

    const { data: existing } = await admin
      .from('client_contacts')
      .select('id')
      .eq('entreprise_id', entreprise.id)
      .eq('client_id', dto.client_id)
      .maybeSingle();

    if (existing) {
      return { attached: true };
    }

    const { error } = await admin.from('client_contacts').insert({
      entreprise_id: entreprise.id,
      client_id: dto.client_id,
    });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return { attached: true };
  }

  async detachClient(entrepriseRef: string, clientId: string, user: AuthUser | null) {
    this.ensureOwner(user);
    const ref = entrepriseRef || user?.slug || user?.id;
    if (!ref) {
      throw new BadRequestException('Référence entreprise manquante');
    }

    const entreprise = await this.accessService.findEntreprise(String(ref));
    if (!this.accessService.canAccessEntreprise(user!, entreprise)) {
      throw new ForbiddenException('Accès interdit');
    }

    const admin = this.supabaseService.getAdminClient();
    const { error, count } = await admin
      .from('client_contacts')
      .delete({ count: 'exact' })
      .eq('entreprise_id', entreprise.id)
      .eq('client_id', clientId);

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    if ((count ?? 0) === 0) {
      throw new NotFoundException('Lien client introuvable');
    }

    return { detached: true };
  }
}
