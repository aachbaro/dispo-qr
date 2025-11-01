// src/factures/dto/facture-create.dto.ts
// -------------------------------------------------------------
// DTO : Création d'une facture
// -------------------------------------------------------------
//
// 📌 Description :
//   - Étend la création Supabase avec des options utiles (mission liée, génération lien)
//
// 📍 Endpoints :
//   - POST /api/factures
//
// 🔒 Règles d’accès :
//   - Vérifiées côté service (owner/admin entreprise)
//
// ⚠️ Remarques :
//   - `mission_id` est optionnel
//   - `generatePaymentLink` déclenche la création d'une session Stripe côté service
//
// -------------------------------------------------------------

import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'

import { FACTURE_STATUS_VALUES } from './facture-status.constants'
import type { FactureStatusValue } from './facture-status.constants'
import type { Insert } from '../../types/aliases'
// -------------------------------------------------------------
// Supabase typing helpers
// -------------------------------------------------------------
type FactureInsert = Insert<'factures'>

type NullableNumber = number | null

type NullableString = string | null

export class FactureCreateDto {
  @IsOptional()
  @IsString()
  client_address_ligne1?: NullableString

  @IsOptional()
  @IsString()
  client_address_ligne2?: NullableString

  @IsOptional()
  @IsString()
  client_code_postal?: NullableString

  @IsString()
  @IsNotEmpty()
  client_name!: FactureInsert['client_name']

  @IsOptional()
  @IsString()
  client_pays?: NullableString

  @IsOptional()
  @IsString()
  client_ville?: NullableString

  @IsOptional()
  @IsString()
  conditions_paiement?: NullableString

  @IsOptional()
  @IsEmail()
  contact_email?: NullableString

  @IsOptional()
  @IsString()
  contact_name?: NullableString

  @IsOptional()
  @IsString()
  contact_phone?: NullableString

  @IsOptional()
  @IsDateString()
  date_emission?: FactureInsert['date_emission']

  @IsOptional()
  @IsString()
  description?: NullableString

  @IsOptional()
  @IsInt()
  entreprise_id?: FactureInsert['entreprise_id']

  @IsOptional()
  @IsNumber()
  hours?: NullableNumber

  @IsOptional()
  @IsString()
  mention_tva?: NullableString

  @IsOptional()
  @IsInt()
  mission_id?: FactureInsert['mission_id']

  @IsNumber()
  @Min(0)
  montant_ht!: FactureInsert['montant_ht']

  @IsNumber()
  @Min(0)
  montant_ttc!: FactureInsert['montant_ttc']

  @IsString()
  @IsNotEmpty()
  numero!: FactureInsert['numero']

  @IsOptional()
  @IsString()
  payment_link?: NullableString

  @IsOptional()
  @IsString()
  penalites_retard?: NullableString

  @IsOptional()
  @IsNumber()
  rate?: NullableNumber

  @IsOptional()
  @IsEnum(FACTURE_STATUS_VALUES)
  status?: FactureStatusValue

  @IsOptional()
  @IsString()
  stripe_payment_intent?: NullableString

  @IsOptional()
  @IsString()
  stripe_session_id?: NullableString

  @IsOptional()
  @IsNumber()
  tva?: NullableNumber

  @IsOptional()
  @IsString()
  url?: NullableString

  @IsOptional()
  @IsBoolean()
  generatePaymentLink?: boolean
}
