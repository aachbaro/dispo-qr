import { Type } from 'class-transformer'
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'

import type { Database } from '../../types/database'
type Insert<Name extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][Name]['Insert']
type Enum<Name extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][Name]

type MissionInsert = Insert<'missions'>
type SlotInsert = Insert<'slots'>
type MissionStatus = Enum<'mission_status'>
type MissionMode = Enum<'mission_mode'>

export class MissionSlotDto
  implements Pick<SlotInsert, 'start' | 'end' | 'title'>
{
  @IsString()
  start!: NonNullable<SlotInsert['start']>

  @IsString()
  end!: NonNullable<SlotInsert['end']>

  @IsOptional()
  @IsString()
  title?: SlotInsert['title']
}

export interface MissionCreatePayload extends MissionInsert {
  entrepriseRef?: string | null
  slots?: MissionSlotDto[]
}

export class MissionCreateDto implements MissionCreatePayload {
  @IsOptional()
  @IsString()
  entrepriseRef?: MissionCreatePayload['entrepriseRef']

  @IsOptional()
  @IsString()
  client_id?: MissionInsert['client_id']

  @IsString()
  contact_email!: MissionInsert['contact_email']

  @IsOptional()
  @IsString()
  contact_name?: MissionInsert['contact_name']

  @IsString()
  contact_phone!: MissionInsert['contact_phone']

  @IsOptional()
  @IsString()
  created_at?: MissionInsert['created_at']

  @IsOptional()
  @IsString()
  devis_url?: MissionInsert['devis_url']

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  entreprise_id?: MissionInsert['entreprise_id']

  @IsString()
  etablissement!: MissionInsert['etablissement']

  @IsOptional()
  @IsString()
  etablissement_adresse_ligne1?: MissionInsert['etablissement_adresse_ligne1']

  @IsOptional()
  @IsString()
  etablissement_adresse_ligne2?: MissionInsert['etablissement_adresse_ligne2']

  @IsOptional()
  @IsString()
  etablissement_code_postal?: MissionInsert['etablissement_code_postal']

  @IsOptional()
  @IsString()
  etablissement_pays?: MissionInsert['etablissement_pays']

  @IsOptional()
  @IsString()
  etablissement_ville?: MissionInsert['etablissement_ville']

  @IsOptional()
  @IsString()
  freelance_id?: MissionInsert['freelance_id']

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  id?: MissionInsert['id']

  @IsOptional()
  @IsString()
  instructions?: MissionInsert['instructions']

  @IsOptional()
  @IsEnum(['remote', 'on_site', 'hybrid'] satisfies MissionMode[])
  mode?: MissionInsert['mode']

  @IsOptional()
  @IsEnum([
    'proposed',
    'validated',
    'pending_payment',
    'paid',
    'completed',
    'refused',
    'realized',
  ] satisfies MissionStatus[])
  status?: MissionInsert['status']

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MissionSlotDto)
  @IsArray()
  slots?: MissionCreatePayload['slots']
}
