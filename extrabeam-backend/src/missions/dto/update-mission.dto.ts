// src/missions/dto/update-mission.dto.ts
// -------------------------------------------------------------
// DTO : Mise à jour d'une mission
// -------------------------------------------------------------
//
// 📌 Description :
//   - Charge utile partielle pour modifier une mission existante
//   - Autorise la mise à jour des slots liés
//
// 📍 Endpoints concernés :
//   - PUT /api/missions/:id
//
// 🔒 Règles d’accès :
//   - Vérifiées côté service via AccessService
//
// ⚠️ Remarques :
//   - `slots` remplace intégralement les créneaux associés
//
// -------------------------------------------------------------

import type { TablesUpdate } from '../../common/types/database';
import type { MissionSlotInput } from './create-mission.dto';

export interface UpdateMissionDto extends TablesUpdate<'missions'> {
  slots?: MissionSlotInput[] | null;
}
