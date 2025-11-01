// src/factures/dto/facture-update.dto.ts
// -------------------------------------------------------------
// DTO : Mise à jour d'une facture
// -------------------------------------------------------------
//
// 📌 Description :
//   - Reprise du type Update<'factures'> pour PUT /api/factures/:id
//
// -------------------------------------------------------------

import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator'

import { FACTURE_STATUS_VALUES } from './facture-status.constants'
import type { FactureStatusValue } from './facture-status.constants'
import type { Update } from '../../types/aliases'
// -------------------------------------------------------------
// Supabase typing helpers
// -------------------------------------------------------------
type FactureUpdate = Update<'factures'>

type NullableNumber = number | null

type NullableString = string | null

export class FactureUpdateDto {
  @IsOptional()
  @IsString()
  client_address_ligne1?: NullableString

  @IsOptional()
  @IsString()
  client_address_ligne2?: NullableString

  @IsOptional()
  @IsString()
  client_code_postal?: NullableString

  @IsOptional()
  @IsString()
  client_name?: FactureUpdate['client_name']

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
  date_emission?: FactureUpdate['date_emission']

  @IsOptional()
  @IsString()
  description?: NullableString

  @IsOptional()
  @IsNumber()
  hours?: NullableNumber

  @IsOptional()
  @IsString()
  mention_tva?: NullableString

  @IsOptional()
  @IsInt()
  mission_id?: FactureUpdate['mission_id']

  @IsOptional()
  @IsNumber()
  montant_ht?: FactureUpdate['montant_ht']

  @IsOptional()
  @IsNumber()
  montant_ttc?: FactureUpdate['montant_ttc']

  @IsOptional()
  @IsString()
  numero?: FactureUpdate['numero']

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
}
