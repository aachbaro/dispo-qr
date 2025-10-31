// src/missions/dto/update-mission-status.dto.ts
// -------------------------------------------------------------
// DTO : Mise à jour du statut d'une mission
// -------------------------------------------------------------
//
// 📌 Description :
//   - Limite la charge utile à la transition de statut
//
// 📍 Endpoints concernés :
//   - POST /api/missions/:id/status
//
// 🔒 Règles d’accès :
//   - Guards JwtAuthGuard + AccessService côté service
//
// ⚠️ Remarques :
//   - Utilise l'enum `mission_status` défini côté Supabase
//
// -------------------------------------------------------------

import { IsEnum } from 'class-validator'

import type { Database } from '../../types/database'

type Enum<Name extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][Name]

export class MissionUpdateStatusDto {
  @IsEnum([
    'proposed',
    'validated',
    'pending_payment',
    'paid',
    'completed',
    'refused',
    'realized',
  ] satisfies Array<Enum<'mission_status'>>)
  status!: Enum<'mission_status'>
}
