// src/services/slots.ts
// -------------------------------------------------------------
// Services liés aux créneaux (slots) d'une entreprise
// -------------------------------------------------------------
//
// 📌 Description :
//   - Gestion CRUD des créneaux (slots) associés à une entreprise
//   - Les slots peuvent être liés à une mission (mission_id)
//   - Permet la lecture publique (par slug) et la gestion propriétaire
//
// 📍 Endpoints :
//   - GET    /api/entreprises/[ref]/slots
//   - POST   /api/entreprises/[id]/slots
//   - PUT    /api/entreprises/[id]/slots/[id]
//   - DELETE /api/entreprises/[id]/slots/[id]
//
// 🔒 Règles d’accès :
//   - Lecture publique : via slug
//   - CRUD complet : via id entreprise (owner uniquement)
//
// ⚠️ Remarques :
//   - Le champ `title` est optionnel (remplacé par mission.etablissement côté front)
//   - mission_id permet de rattacher un slot à une mission
//
// -------------------------------------------------------------

import { request } from "./api";
import type { Tables, TablesInsert, TablesUpdate } from "../../../types/database";

// ----------------------
// Types
// ----------------------

export type Slot = Tables<"slots">;
export type SlotInsert = TablesInsert<"slots">;
export type SlotUpdate = TablesUpdate<"slots">;

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
  entrepriseId: number | string,
  slot: Pick<SlotInsert, "start" | "end"> & {
    title?: string;
    mission_id?: number;
  }
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
  entrepriseId: number | string,
  id: number,
  updates: SlotUpdate
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
  entrepriseId: number | string,
  id: number
): Promise<void> {
  await request(`/api/entreprises/${entrepriseId}/slots/${id}`, {
    method: "DELETE",
  });
}
