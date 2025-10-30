// src/factures/factures.service.ts
// -------------------------------------------------------------
// Service : Factures
// -------------------------------------------------------------
//
// 📌 Description :
//   - Porte le portage de l’ancienne API Vercel `/api/factures/*`
//   - Gère la création, la lecture et la mise à jour des factures Supabase
//   - Interface avec Stripe (PaymentsService) et le module Notifications
//
// 📍 Endpoints :
//   - GET    /api/factures
//   - GET    /api/factures/:id
//   - POST   /api/factures
//   - PUT    /api/factures/:id
//   - POST   /api/factures/:id/send
//
// 🔒 Règles d’accès :
//   - Accès réservé aux propriétaires de l’entreprise (ou admin)
//   - Clients : lecture des factures liées à leurs missions uniquement
//
// ⚠️ Remarques :
//   - Les calculs (heures, montants) sont alignés sur l’ancienne API
//   - `generatePaymentLink` délègue à `PaymentsService`
//   - Envoi de mails confié à `NotificationsService`
//
// -------------------------------------------------------------

import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';

import type { AuthUser } from '../common/auth/auth.types';
import { AccessService } from '../common/auth/access.service';
import { SupabaseService } from '../common/supabase/supabase.service';
import type { Tables } from '../common/types/database';
import type { CreateFactureDto } from './dto/create-facture.dto';
import type { UpdateFactureDto } from './dto/update-facture.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { PaymentsService } from '../payments/payments.service';

const ENTREPRISE_ROLES = new Set(['freelance', 'entreprise', 'admin']);
const FACTURE_SELECT = '*, missions(*, slots(*), entreprise:entreprise_id(*), client:client_id(*))';

export type FactureWithRelations = Tables<'factures'> & {
  missions: (Tables<'missions'> & {
    slots?: Tables<'slots'>[];
    entreprise?: Tables<'entreprise'> | null;
    client?: Tables<'profiles'> | null;
  }) | null;
};

@Injectable()
export class FacturesService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly accessService: AccessService,
    @Inject(forwardRef(() => PaymentsService))
    private readonly paymentsService: PaymentsService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  private ensureUser(user: AuthUser | null): asserts user is AuthUser {
    if (!user) {
      throw new UnauthorizedException('Authentification requise');
    }
  }

  private async loadEntrepriseForUser(user: AuthUser, ref: string): Promise<Tables<'entreprise'>> {
    const entreprise = await this.accessService.findEntreprise(ref);
    if (!this.accessService.canAccessEntreprise(user, entreprise)) {
      throw new ForbiddenException("Accès interdit à l'entreprise");
    }
    return entreprise;
  }

  private async fetchFacture(id: number): Promise<FactureWithRelations> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('factures')
      .select(FACTURE_SELECT)
      .eq('id', id)
      .maybeSingle<FactureWithRelations>();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException('Facture introuvable');
      }
      throw new InternalServerErrorException(error.message);
    }

    if (!data) {
      throw new NotFoundException('Facture introuvable');
    }

    return data;
  }

  private assertEntrepriseRole(user: AuthUser) {
    if (!ENTREPRISE_ROLES.has(user.role ?? '')) {
      throw new ForbiddenException('Accès réservé aux entreprises');
    }
  }

  async listFactures(entrepriseRef: string, user: AuthUser | null): Promise<FactureWithRelations[]> {
    this.ensureUser(user);
    this.assertEntrepriseRole(user);

    const ref = entrepriseRef || user.slug || user.id;
    if (!ref) {
      throw new BadRequestException('Référence entreprise manquante');
    }

    const entreprise = await this.loadEntrepriseForUser(user, String(ref));
    const admin = this.supabaseService.getAdminClient();

    const { data, error } = await admin
      .from('factures')
      .select(FACTURE_SELECT)
      .eq('entreprise_id', entreprise.id)
      .order('date_emission', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return (data as FactureWithRelations[]) ?? [];
  }

  async getFacture(id: number, user: AuthUser | null): Promise<FactureWithRelations> {
    this.ensureUser(user);

    const facture = await this.fetchFacture(id);
    const role = user.role ?? '';

    if (ENTREPRISE_ROLES.has(role)) {
      const entreprise =
        facture.missions?.entreprise ??
        (await this.accessService.findEntreprise(String(facture.entreprise_id)));
      if (!this.accessService.canAccessEntreprise(user, entreprise)) {
        throw new ForbiddenException('Accès interdit');
      }
    } else if (role === 'client') {
      if (facture.missions?.client_id !== user.id) {
        throw new ForbiddenException('Facture inaccessible');
      }
    } else {
      throw new ForbiddenException('Rôle non autorisé');
    }

    return facture;
  }

  private async computeFromMission(missionId: number, entrepriseId: number) {
    const admin = this.supabaseService.getAdminClient();

    const { data: slots, error: slotsError } = await admin
      .from('slots')
      .select('start, end')
      .eq('mission_id', missionId);

    if (slotsError) {
      throw new InternalServerErrorException(slotsError.message);
    }

    let totalHours = 0;
    for (const slot of slots ?? []) {
      if (slot.start && slot.end) {
        const start = new Date(slot.start).getTime();
        const end = new Date(slot.end).getTime();
        if (!Number.isNaN(start) && !Number.isNaN(end) && end > start) {
          totalHours += (end - start) / (1000 * 60 * 60);
        }
      }
    }

    const entreprise = await this.accessService.findEntreprise(String(entrepriseId));
    const rate = entreprise.taux_horaire ?? 0;
    const montantHt = totalHours * rate;

    return {
      hours: totalHours,
      rate,
      montant_ht: montantHt,
      montant_ttc: montantHt,
    };
  }

  async createFacture(input: CreateFactureDto, user: AuthUser | null): Promise<FactureWithRelations> {
    this.ensureUser(user);
    this.assertEntrepriseRole(user);

    const ref = input.entreprise_id ? String(input.entreprise_id) : user.slug || user.id;
    if (!ref) {
      throw new BadRequestException('Référence entreprise manquante');
    }

    const entreprise = await this.loadEntrepriseForUser(user, ref);

    const admin = this.supabaseService.getAdminClient();

    const payload: CreateFactureDto = {
      ...input,
      entreprise_id: entreprise.id,
      mission_id: input.mission_id ?? null,
    };

    if (payload.mission_id) {
      const { hours, rate, montant_ht, montant_ttc } = await this.computeFromMission(
        payload.mission_id,
        entreprise.id,
      );
      payload.hours = hours;
      payload.rate = rate;
      payload.montant_ht = montant_ht;
      payload.montant_ttc = payload.montant_ttc ?? montant_ttc;
      payload.tva = payload.tva ?? 0;
      if (payload.tva && payload.tva > 0) {
        payload.montant_ttc = montant_ht + payload.tva;
      }
    }

    const { generatePaymentLink, ...factureData } = payload;

    const { data, error } = await admin
      .from('factures')
      .insert(factureData)
      .select()
      .single<Tables<'factures'>>();

    if (error) {
      if ((error as any).code === '23505') {
        throw new BadRequestException('Numéro de facture déjà utilisé');
      }
      throw new InternalServerErrorException(error.message);
    }

    if (generatePaymentLink) {
      await this.paymentsService.createCheckoutForFacture(data.id, user);
    }

    const facture = await this.fetchFacture(data.id);

    try {
      await this.notificationsService.notifyFactureCreated(facture, entreprise);
    } catch (error) {
      // Notification non bloquante
      console.warn('Notification facture échouée:', (error as Error).message);
    }

    return facture;
  }

  async updateFacture(id: number, input: UpdateFactureDto, user: AuthUser | null): Promise<FactureWithRelations> {
    this.ensureUser(user);

    const facture = await this.fetchFacture(id);
    const role = user.role ?? '';

    if (!ENTREPRISE_ROLES.has(role)) {
      throw new ForbiddenException('Accès réservé au propriétaire');
    }

    const entreprise = await this.accessService.findEntreprise(String(facture.entreprise_id));
    if (!this.accessService.canAccessEntreprise(user, entreprise)) {
      throw new ForbiddenException('Accès interdit');
    }

    const admin = this.supabaseService.getAdminClient();
    const payload: UpdateFactureDto = {
      ...input,
      mission_id: input.mission_id ?? null,
    };

    const { error } = await admin
      .from('factures')
      .update(payload)
      .eq('id', id)
      .eq('entreprise_id', facture.entreprise_id);

    if (error) {
      if (error.code === '23505') {
        throw new BadRequestException('Numéro de facture déjà utilisé');
      }
      throw new InternalServerErrorException(error.message);
    }

    if (payload.status === 'paid' && facture.mission_id) {
      await admin
        .from('missions')
        .update({ status: 'paid' })
        .eq('id', facture.mission_id);
    }

    return this.fetchFacture(id);
  }

  async sendFacture(id: number, user: AuthUser | null): Promise<{ sent: true }> {
    this.ensureUser(user);
    const facture = await this.fetchFacture(id);

    const entreprise = await this.accessService.findEntreprise(String(facture.entreprise_id));
    if (!this.accessService.canAccessEntreprise(user, entreprise)) {
      throw new ForbiddenException('Accès interdit');
    }

    await this.notificationsService.sendFactureNotification(id, user);
    return { sent: true };
  }
}
