// src/entreprises/entreprises.service.ts
// -------------------------------------------------------------
// Service : Entreprises
// -------------------------------------------------------------
//
// 📌 Description :
//   - Encapsule la logique métier liée aux entreprises (lecture publique et privée)
//   - Interagit avec Supabase pour récupérer entreprises, missions, factures, slots, indisponibilités
//   - Vérifie les permissions d’accès via AccessService
//
// 🔒 Règles d’accès :
//   - Vue publique disponible sans authentification
//   - Vue propriétaire/admin disponible si canAccessEntreprise(user, entreprise)
//
// ⚠️ Remarques :
//   - Utilise les typages forts Supabase (Tables<T>)
//   - Réplique la logique historique de l’API Vercel `/api/entreprises/[ref]/overview`
//
// -------------------------------------------------------------

import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';

import type { AuthUser } from '../common/auth/auth.types';
import { AccessService } from '../common/auth/access.service';
import { SupabaseService } from '../common/supabase/supabase.service';
import type { Tables } from '../common/types/database';

const PUBLIC_ENTREPRISE_COLUMNS: Array<keyof Tables<'entreprise'>> = [
  'id',
  'slug',
  'nom',
  'prenom',
  'adresse_ligne1',
  'adresse_ligne2',
  'ville',
  'code_postal',
  'pays',
  'email',
  'telephone',
  'taux_horaire',
  'devise',
  'created_at',
];

const MISSION_SELECT = '*, slots(*), client:client_id(*), entreprise:entreprise_id(*)';

export type PublicEntreprise = Pick<Tables<'entreprise'>, (typeof PUBLIC_ENTREPRISE_COLUMNS)[number]>;

type MissionWithRelations = Tables<'missions'> & {
  slots: Tables<'slots'>[];
  client: Tables<'profiles'> | null;
  entreprise: Tables<'entreprise'> | null;
};

type SlotWithMission = Tables<'slots'> & {
  missions?: {
    status: string | null;
  } | null;
};

@Injectable()
export class EntreprisesService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly accessService: AccessService,
  ) {}

  /**
   * 🧩 Convertit un enregistrement entreprise complet en vue publique
   * Accepte `null` et `undefined` sans conflit de typage
   */
  private mapToPublicEntreprise(entreprise: Tables<'entreprise'>): PublicEntreprise {
    const result = {} as Record<
      keyof PublicEntreprise,
      PublicEntreprise[keyof PublicEntreprise]
    >;

    for (const key of PUBLIC_ENTREPRISE_COLUMNS) {
      result[key] = (entreprise[key] ?? null) as PublicEntreprise[keyof PublicEntreprise];
    }

    return result as PublicEntreprise;
  }

  private handleSupabaseError(error: any, notFoundMessage = 'Entreprise non trouvée'): never {
    if (error?.code === 'PGRST116' || error?.details?.includes('Results contain 0 rows')) {
      throw new NotFoundException(notFoundMessage);
    }

    const message = typeof error?.message === 'string' ? error.message : 'Erreur Supabase';
    throw new InternalServerErrorException(message);
  }

  private async fetchEntreprise(ref: string): Promise<Tables<'entreprise'>> {
    try {
      return await this.accessService.findEntreprise(ref);
    } catch (error) {
      this.handleSupabaseError(error);
    }
  }

  async getPublicEntreprises() {
    const client = this.supabaseService.getAdminClient();

    const { data, error } = await client
      .from('entreprise')
      .select(
        'id, slug, nom, prenom, adresse_ligne1, adresse_ligne2, ville, code_postal, pays, email, telephone, taux_horaire, devise, created_at',
      )
      .order('created_at', { ascending: false });

    if (error) {
      this.handleSupabaseError(error, 'Impossible de récupérer les entreprises');
    }

    return { entreprises: (data as PublicEntreprise[]) ?? [] };
  }

  async getEntreprise(ref: string, user: AuthUser | null) {
    const entreprise = await this.fetchEntreprise(ref);
    const canAccessSensitive = !!user && this.accessService.canAccessEntreprise(user, entreprise);

    const baseData: Partial<Tables<'entreprise'>> = {
      id: entreprise.id,
      slug: entreprise.slug,
      nom: entreprise.nom,
      prenom: entreprise.prenom,
      adresse_ligne1: entreprise.adresse_ligne1,
      adresse_ligne2: entreprise.adresse_ligne2,
      ville: entreprise.ville,
      code_postal: entreprise.code_postal,
      pays: entreprise.pays,
      email: entreprise.email,
      telephone: entreprise.telephone,
      taux_horaire: entreprise.taux_horaire,
      devise: entreprise.devise,
      created_at: entreprise.created_at,
      stripe_account_id: entreprise.stripe_account_id,
    };

    if (canAccessSensitive) {
      Object.assign(baseData, {
        siret: entreprise.siret,
        statut_juridique: entreprise.statut_juridique,
        tva_intracom: entreprise.tva_intracom,
        mention_tva: entreprise.mention_tva,
        iban: entreprise.iban,
        bic: entreprise.bic,
        conditions_paiement: entreprise.conditions_paiement,
        penalites_retard: entreprise.penalites_retard,
        updated_at: entreprise.updated_at,
      });
    }

    return { entreprise: baseData };
  }

  async getEntrepriseOverview(ref: string, user: AuthUser | null) {
    const entreprise = await this.fetchEntreprise(ref);
    const canAccessSensitive = !!user && this.accessService.canAccessEntreprise(user, entreprise);

    const client = this.supabaseService.getAdminClient();

    if (canAccessSensitive) {
      const [missions, factures, slots, unavailabilities] = await Promise.all([
        client
          .from('missions')
          .select(MISSION_SELECT)
          .eq('entreprise_id', entreprise.id)
          .order('created_at', { ascending: false }),
        client
          .from('factures')
          .select('*')
          .eq('entreprise_id', entreprise.id)
          .order('created_at', { ascending: false }),
        client
          .from('slots')
          .select('*')
          .eq('entreprise_id', entreprise.id)
          .order('start', { ascending: true }),
        client
          .from('unavailabilities')
          .select('*')
          .eq('entreprise_id', entreprise.id),
      ]);

      if (missions.error) {
        this.handleSupabaseError(missions.error, 'Impossible de récupérer les missions');
      }
      if (factures.error) {
        this.handleSupabaseError(factures.error, 'Impossible de récupérer les factures');
      }
      if (slots.error) {
        this.handleSupabaseError(slots.error, 'Impossible de récupérer les slots');
      }
      if (unavailabilities.error) {
        this.handleSupabaseError(unavailabilities.error, 'Impossible de récupérer les indisponibilités');
      }

      return {
        mode: 'owner' as const,
        entreprise,
        missions: (missions.data as MissionWithRelations[]) ?? [],
        factures: (factures.data as Tables<'factures'>[]) ?? [],
        slots: (slots.data as Tables<'slots'>[]) ?? [],
        unavailabilities: (unavailabilities.data as Tables<'unavailabilities'>[]) ?? [],
      };
    }

    const [slots, unavailabilities] = await Promise.all([
      client
        .from('slots')
        .select('*, missions(status)')
        .eq('entreprise_id', entreprise.id),
      client
        .from('unavailabilities')
        .select('*')
        .eq('entreprise_id', entreprise.id),
    ]);

    if (slots.error) {
      this.handleSupabaseError(slots.error, 'Impossible de récupérer les slots');
    }
    if (unavailabilities.error) {
      this.handleSupabaseError(unavailabilities.error, 'Impossible de récupérer les indisponibilités');
    }

    const publicSlots = ((slots.data as SlotWithMission[]) ?? []).filter((slot) => {
      if (!slot.mission_id) {
        return true;
      }

      const status = slot.missions?.status ?? '';
      return ['validated', 'paid', 'completed'].includes(status);
    });

    return {
      mode: 'public' as const,
      entreprise: this.mapToPublicEntreprise(entreprise),
      slots: publicSlots,
      unavailabilities: (unavailabilities.data as Tables<'unavailabilities'>[]) ?? [],
    };
  }
}
