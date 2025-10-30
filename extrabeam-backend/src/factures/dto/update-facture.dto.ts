// src/factures/dto/update-facture.dto.ts
// -------------------------------------------------------------
// DTO : Mise à jour d'une facture
// -------------------------------------------------------------
//
// 📌 Description :
//   - Reprise du type TablesUpdate<'factures'>
//   - Utilisé pour PUT /api/factures/:id
//
// -------------------------------------------------------------

import type { TablesUpdate } from '../../common/types/database';

export type UpdateFactureDto = TablesUpdate<'factures'>;
