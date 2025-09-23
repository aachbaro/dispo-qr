// src/services/slots.ts
// -------------------------------------------------------------
// Services liés aux créneaux (slots) d'une entreprise
//
// Fonctions disponibles :
// - getEntrepriseSlots(ref, params?)            : liste les slots d'une entreprise
// - createEntrepriseSlot(entrepriseId, slot)    : créer un slot (owner uniquement)
// - updateEntrepriseSlot(entrepriseId, id, updates) : mettre à jour un slot
// - deleteEntrepriseSlot(entrepriseId, id)      : supprimer un slot
//
// ⚠️ Notes :
// - L’accès public se fait via le slug (string).
// - L’accès propriétaire (CRUD complet) se fait via l’id numérique.
// - Les contrôles d’accès sont gérés côté API.
// -------------------------------------------------------------

import { request } from "./api";

// ----------------------
// Types
// ----------------------
export interface Slot {
  id: number;
  start: string;
  end: string;
  title: string;
  created_at: string;
  entreprise_id: number;
}

// ----------------------
// Services Slots
// ----------------------

/**
 * 📜 Liste des slots d'une entreprise
 * @param ref - slug (string) pour lecture publique, ou id (number) pour accès owner
 */
export async function getEntrepriseSlots(
  ref: string | number,
  params?: { from?: string; to?: string }
): Promise<{ slots: Slot[] }> {
  const query =
    params?.from && params?.to
      ? `?from=${encodeURIComponent(params.from)}&to=${encodeURIComponent(
          params.to
        )}`
      : "";

  return request<{ slots: Slot[] }>(`/api/entreprises/${ref}/slots${query}`);
}

/**
 * ➕ Créer un slot (owner uniquement)
 */
export async function createEntrepriseSlot(
  entrepriseId: number,
  slot: Pick<Slot, "start" | "end" | "title">
): Promise<{ slot: Slot }> {
  return request<{ slot: Slot }>(`/api/entreprises/${entrepriseId}/slots`, {
    method: "POST",
    body: JSON.stringify(slot),
  });
}

/**
 * ✏️ Mettre à jour un slot (owner uniquement)
 */
export async function updateEntrepriseSlot(
  entrepriseId: number,
  id: number,
  updates: Partial<Slot>
): Promise<{ slot: Slot }> {
  return request<{ slot: Slot }>(
    `/api/entreprises/${entrepriseId}/slots/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(updates),
    }
  );
}

/**
 * ❌ Supprimer un slot (owner uniquement)
 */
export async function deleteEntrepriseSlot(
  entrepriseId: number,
  id: number
): Promise<void> {
  await request(`/api/entreprises/${entrepriseId}/slots/${id}`, {
    method: "DELETE",
  });
}
