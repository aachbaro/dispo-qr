// src/services/factures.ts
// -------------------------------------------------------------
// Services liés aux factures d'une entreprise
// -------------------------------------------------------------
//
// 📌 Description :
//   - CRUD des factures
//   - Chaque facture peut être liée à une mission (via mission_id)
//   - Les heures, le taux, le HT et TTC sont stockés en base pour générer le PDF
//
// 📍 Endpoints :
//   - GET    /api/entreprises/[ref]/factures
//   - POST   /api/entreprises/[ref]/factures
//   - GET    /api/entreprises/[ref]/factures/[id]
//   - PUT    /api/entreprises/[ref]/factures/[id]
//   - DELETE /api/entreprises/[ref]/factures/[id]
//   - POST   /api/entreprises/[ref]/factures/[id]/payment-link
//
// 🔒 Règles d’accès :
//   - Lecture publique (slug) / owner (id)
//   - CRUD limité aux entreprises propriétaires
//
// ⚠️ Remarques :
//   - Typage basé sur types/database.ts généré automatiquement
//   - Pas de duplication manuelle des interfaces
// -------------------------------------------------------------

import { request } from "./api";
import type { Tables, TablesInsert, TablesUpdate } from "../../types/database";

// ----------------------
// Types
// ----------------------

export type Facture = Tables<"factures">;
export type FactureInsert = TablesInsert<"factures">;
export type FactureUpdate = TablesUpdate<"factures">;

// ----------------------
// Services Factures
// ----------------------

/**
 * 📋 Lister toutes les factures d'une entreprise
 */
export async function listEntrepriseFactures(
  ref: string | number
): Promise<{ factures: Facture[] }> {
  return request<{ factures: Facture[] }>(`/api/entreprises/${ref}/factures`);
}

/**
 * ➕ Créer une facture
 */
export async function createEntrepriseFacture(
  ref: string | number,
  payload: FactureInsert
): Promise<{ facture: Facture }> {
  return request<{ facture: Facture }>(`/api/entreprises/${ref}/factures`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * 🔍 Récupérer une facture par son id
 */
export async function getEntrepriseFacture(
  ref: string | number,
  factureId: number
): Promise<{ facture: Facture }> {
  return request<{ facture: Facture }>(
    `/api/entreprises/${ref}/factures/${factureId}`
  );
}

/**
 * ✏️ Mettre à jour une facture
 */
export async function updateEntrepriseFacture(
  ref: string | number,
  factureId: number,
  updates: FactureUpdate
): Promise<{ facture: Facture }> {
  return request<{ facture: Facture }>(
    `/api/entreprises/${ref}/factures/${factureId}`,
    {
      method: "PUT",
      body: JSON.stringify(updates),
    }
  );
}

/**
 * ❌ Supprimer une facture
 */
export async function deleteEntrepriseFacture(
  ref: string | number,
  factureId: number
): Promise<void> {
  await request(`/api/entreprises/${ref}/factures/${factureId}`, {
    method: "DELETE",
  });
}

/**
 * 🔗 Générer un lien de paiement pour une facture
 */
export async function generateFacturePaymentLink(
  ref: string | number,
  factureId: number
): Promise<{ url: string }> {
  return request<{ url: string }>(
    `/api/entreprises/${ref}/factures/${factureId}/payment-link`,
    { method: "POST" }
  );
}

/**
 * 📌 Récupérer toutes les factures liées à une mission
 */
export async function listFacturesByMission(
  ref: string | number,
  missionId: number
): Promise<Facture[]> {
  const { factures } = await request<{ factures: Facture[] }>(
    `/api/entreprises/${ref}/factures?mission_id=${missionId}`
  );
  return factures;
}
