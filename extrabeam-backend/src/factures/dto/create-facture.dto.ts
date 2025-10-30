// src/factures/dto/create-facture.dto.ts
// -------------------------------------------------------------
// DTO : Création d'une facture
// -------------------------------------------------------------
//
// 📌 Description :
//   - Étend l'insert Supabase avec des options utiles (mission liée, génération lien)
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

import type { TablesInsert } from '../../common/types/database';

export interface CreateFactureDto extends TablesInsert<'factures'> {
  mission_id?: number | null;
  generatePaymentLink?: boolean;
}
