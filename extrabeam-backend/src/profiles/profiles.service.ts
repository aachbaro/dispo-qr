// src/profiles/profiles.service.ts
// -------------------------------------------------------------
// Service : Gestion des profils utilisateurs
// -------------------------------------------------------------
//
// 📌 Description :
//   - Gère la création et mise à jour des profils Supabase (`profiles`)
//   - Synchronise automatiquement les entités liées :
//       • Entreprise (freelance)
//       • Client (espace client)
//   - Garantit la cohérence des slugs entreprises et la génération automatique
//
// 🧱 Architecture :
//   - Utilise SupabaseService (client admin) pour toutes les opérations DB
//   - Appelé par ProfilesController et AuthService (après inscription)
//   - Typage fort basé sur `types/database.ts`
//
// 🔒 Sécurité :
//   - L’utilisateur ne peut modifier que son propre profil
//   - Vérifie les rôles avant de créer entreprise/client associés
//
// ⚠️ Remarques :
//   - Le slug entreprise est toujours unique (format prénom-nom)
//   - Le champ `email` est fallback sur `''` pour éviter les null Supabase
//
// -------------------------------------------------------------

import { BadRequestException, Injectable } from '@nestjs/common'

import { SupabaseService } from '../common/supabase/supabase.service'
import type { AuthUser } from '../common/auth/auth.types'
import type { Insert, Table } from '../types/aliases'

type ProfileRow = Table<'profiles'>
type ProfileInsert = Insert<'profiles'>
type EntrepriseInsert = Insert<'entreprise'>
type ClientInsert = Insert<'clients'>

type ProfileSelection = Pick<
  ProfileRow,
  'id' | 'email' | 'role' | 'first_name' | 'last_name' | 'phone' | 'created_at'
>

export type ProfileSummary = {
  profile: Pick<
    ProfileRow,
    'id' | 'role' | 'first_name' | 'last_name' | 'phone' | 'created_at'
  > & {
    email: string
    slug: string | null
  }
}

@Injectable()
export class ProfilesService {
  constructor(private readonly supabase: SupabaseService) {}

  // -------------------------------------------------------------
  // 🧩 Helpers internes
  // -------------------------------------------------------------

  private normalizeSlugSource(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
  }

  private async generateUniqueSlug(firstName: string, lastName: string) {
    const base = this.normalizeSlugSource(`${firstName}-${lastName}`)
    const admin = this.supabase.getAdminClient()

    let slug = base
    let i = 1

    while (true) {
      const { data, error } = await admin
        .from('entreprise')
        .select('id')
        .eq('slug', slug)
        .maybeSingle<Pick<Table<'entreprise'>, 'id'>>()

      if (error) {
        throw new BadRequestException('Erreur lors de la vérification du slug')
      }

      if (!data) break
      slug = `${base}-${i++}`
    }

    return slug
  }

  // -------------------------------------------------------------
  // 🔍 Lecture du profil utilisateur
  // -------------------------------------------------------------

  async getProfile(user: AuthUser): Promise<ProfileSummary> {
    const admin = this.supabase.getAdminClient()

    const { data: profile, error } = await admin
      .from('profiles')
      .select('id, email, role, first_name, last_name, phone, created_at')
      .eq('id', user.id)
      .maybeSingle<ProfileSelection>()

    if (error) {
      throw new BadRequestException(
        `Erreur récupération profil : ${error.message}`,
      )
    }

    // Récupération éventuelle du slug entreprise (freelance)
    let slug: string | null = null
    if (profile?.role === 'freelance') {
      const { data: entreprise } = await admin
        .from('entreprise')
        .select('slug')
        .eq('user_id', user.id)
        .maybeSingle<Pick<Table<'entreprise'>, 'slug'>>()
      slug = entreprise?.slug ?? null
    }

    return {
      profile: {
        id: user.id,
        email: user.email ?? '',
        role: profile?.role ?? null,
        first_name: profile?.first_name ?? null,
        last_name: profile?.last_name ?? null,
        phone: profile?.phone ?? null,
        slug,
        created_at: profile?.created_at ?? null,
      },
    }
  }

  // -------------------------------------------------------------
  // ✏️ Création ou mise à jour du profil utilisateur
  // -------------------------------------------------------------

  async upsertProfile(
    user: AuthUser,
    payload: Partial<ProfileRow>,
  ): Promise<ProfileSummary> {
    const admin = this.supabase.getAdminClient()
    const { role, first_name, last_name, phone } = payload

    const userId = user.id
    if (!userId) {
      throw new BadRequestException('Utilisateur sans identifiant')
    }

    if (!role) {
      throw new BadRequestException("Le champ 'role' est obligatoire")
    }

    // Vérifie si le profil existe déjà
    const { data: existingProfile } = await admin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle<Pick<ProfileRow, 'id'>>()

    // Données normalisées
    const profileData: ProfileInsert = {
      id: userId,
      email: user.email ?? '',
      role,
      first_name: first_name ?? null,
      last_name: last_name ?? null,
      phone: phone ?? null,
    }

    // Insertion ou mise à jour
    if (!existingProfile) {
      const { error: insertError } = await admin
        .from('profiles')
        .insert(profileData)
      if (insertError) {
        throw new BadRequestException(
          `Erreur création profil : ${insertError.message}`,
        )
      }
    } else {
      const { error: updateError } = await admin
        .from('profiles')
        .update(profileData)
        .eq('id', userId)
      if (updateError) {
        throw new BadRequestException(
          `Erreur mise à jour profil : ${updateError.message}`,
        )
      }
    }

    // -------------------------------------------------------------
    // 🏢 Si role = freelance → création entreprise associée
    // -------------------------------------------------------------
    if (role === 'freelance') {
      const { data: existingEnt } = await admin
        .from('entreprise')
        .select('id, slug')
        .eq('user_id', userId)
        .maybeSingle<Pick<Table<'entreprise'>, 'id' | 'slug'>>()

      if (!existingEnt) {
        const slug = await this.generateUniqueSlug(
          first_name || 'extra',
          last_name || 'user',
        )

        const entrepriseData: EntrepriseInsert = {
          user_id: userId,
          prenom: first_name || '',
          nom: last_name || '',
          email: user.email ?? '',
          slug,
          adresse_ligne1: 'à compléter',
          siret: '',
          iban: '',
          bic: '',
        }

        const { error: entError } = await admin
          .from('entreprise')
          .insert(entrepriseData)
        if (entError) {
          // TODO: remplacer par un système de journalisation applicatif
          console.warn('⚠️ Erreur création entreprise:', entError.message)
        }
      }
    }

    // -------------------------------------------------------------
    // 👤 Si role = client → création client associée
    // -------------------------------------------------------------
    if (role === 'client') {
      const { data: existingClient } = await admin
        .from('clients')
        .select('id')
        .eq('id', userId)
        .maybeSingle<Pick<Table<'clients'>, 'id'>>()

      if (!existingClient) {
        const clientData: ClientInsert = {
          id: userId,
          role: 'client',
        }

        const { error: insertClientError } = await admin
          .from('clients')
          .insert(clientData)
        if (insertClientError) {
          // TODO: remplacer par un système de journalisation applicatif
          console.warn('⚠️ Erreur création client:', insertClientError.message)
        }
      }
    }

    return this.getProfile(user)
  }
}
