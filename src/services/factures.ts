// src/services/factures.ts
// -------------------------------------------------------------
// Services liés aux factures (entreprise & client)
// -------------------------------------------------------------
//
// 📌 Description :
//   - Liste les factures selon le rôle connecté (entreprise/client)
//   - Création/édition/suppression pour l'entreprise propriétaire
//   - Génération de liens de paiement conservée sur les routes historiques
//
// 📍 Endpoints :
//   - GET    /api/factures
//   - POST   /api/factures
//   - GET    /api/entreprises/[ref]/factures/[id]
//   - PUT    /api/entreprises/[ref]/factures/[id]
//   - DELETE /api/entreprises/[ref]/factures/[id]
//   - POST   /api/entreprises/[ref]/factures/[id]/payment-link
//
// 🔒 Règles d’accès :
//   - Clients : lecture seule sur leurs missions
//   - Entreprises/Admin : accès complet + création/mise à jour
//
// ⚠️ Remarques :
//   - Typage basé sur types/database.ts généré automatiquement
//   - Les montants restent calculés côté backend (API `/api/factures`)
// -------------------------------------------------------------

import { request } from "./api";
import type { Tables, TablesInsert, TablesUpdate } from "../../types/database";

// ----------------------
// Types
// ----------------------

export type Facture = Tables<"factures">;
export type FactureInsert = TablesInsert<"factures">;
export type FactureUpdate = TablesUpdate<"factures">;
export type FacturePayload = FactureInsert;

export type FactureWithRelations = Facture & {
  missions?:
    | (Tables<"missions"> & {
        slots?: Tables<"slots">[];
        entreprise_slug?: string | null;
      })
    | null;
};

// ----------------------
// Services Factures
// ----------------------

/**
 * 📋 Lister toutes les factures d'une entreprise
 */
export async function listFactures(
  params: { missionId?: number } = {}
): Promise<{ factures: FactureWithRelations[] }> {
  const searchParams = new URLSearchParams();
  if (params.missionId) searchParams.set("mission_id", params.missionId.toString());
  const query = searchParams.toString();

  return request<{ factures: FactureWithRelations[] }>(
    `/api/factures${query ? `?${query}` : ""}`
  );
}

/**
 * ➕ Créer une facture
 */
export async function createFacture(
  payload: FacturePayload
): Promise<{ facture: Facture }> {
  return request<{ facture: Facture }>(`/api/factures`, {
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
  missionId: number
): Promise<Facture[]> {
  const { factures } = await request<{ factures: Facture[] }>(
    `/api/factures?mission_id=${missionId}`
  );
  return factures;
}
