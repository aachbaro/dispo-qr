// src/missions/dto/create-mission.dto.ts
// -------------------------------------------------------------
// DTO : Création d'une mission
// -------------------------------------------------------------
//
// 📌 Description :
//   - Représente la charge utile attendue lors de la création d'une mission
//   - Étend les colonnes `missions` de Supabase avec les champs utilitaires
//
// 📍 Endpoints concernés :
//   - POST /api/missions
//
// 🔒 Règles d’accès :
//   - Validation réalisée côté service/contrôleur (JwtAuthGuard)
//
// ⚠️ Remarques :
//   - `entrepriseRef` permet de cibler une entreprise via ref/slug/id
//   - `slots` suit le format minimal nécessaire pour créer les entrées liées
//
// -------------------------------------------------------------

import type { TablesInsert } from '../../common/types/database';

export interface MissionSlotInput {
  start: string;
  end: string;
  title?: string | null;
}

export interface CreateMissionDto extends TablesInsert<'missions'> {
  entrepriseRef?: string | number | null;
  slots?: MissionSlotInput[];
}
