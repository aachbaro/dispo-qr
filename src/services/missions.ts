// src/services/missions.ts
// -------------------------------------------------------------
// Services liés aux missions d'une entreprise
// -------------------------------------------------------------
//
// 📌 Description :
//   - Gestion CRUD des missions et de leurs créneaux (slots)
//   - Les slots sont liés à la mission via mission_id
//
// 📍 Endpoints API :
//   - POST   /api/entreprises/[ref]/missions        → créer une mission (+ slots)
//   - GET    /api/entreprises/[ref]/missions        → lister les missions
//   - PUT    /api/entreprises/[ref]/missions/[id]   → mettre à jour une mission
//   - DELETE /api/entreprises/[ref]/missions/[id]   → supprimer une mission
//
// 🔒 Règles d’accès :
//   - ref = slug (string) pour lecture publique, id (number) pour accès propriétaire
//   - Les contrôles d’accès (public vs privé) sont appliqués côté API
//
// ⚠️ Remarques :
//   - On ne stocke plus date_slot/end_slot directement dans mission
//   - Les créneaux sont envoyés dans `slots` (table dédiée)
//   - Typage basé sur types/database.ts
// -------------------------------------------------------------

import { request } from "./api";
import type { Tables, TablesInsert, TablesUpdate } from "../../types/database";
import type { Slot } from "./slots";

// ----------------------
// Types
// ----------------------

export type Mission = Tables<"missions">;
export type MissionInsert = TablesInsert<"missions">;
export type MissionUpdate = TablesUpdate<"missions">;

// Payload enrichi côté frontend : ajoute les slots liés
export type MissionPayload = MissionInsert & {
  slots: Array<Pick<Slot, "start" | "end" | "title">>;
};

// ----------------------
// Services Missions
// ----------------------

/**
 * ➕ Créer une mission (owner uniquement)
 */
export async function createEntrepriseMission(
  entrepriseId: number,
  payload: MissionPayload
): Promise<{ mission: Mission & { slots?: Slot[] } }> {
  return request<{ mission: Mission & { slots?: Slot[] } }>(
    `/api/entreprises/${entrepriseId}/missions`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

/**
 * 📜 Lister les missions d’une entreprise
 */
export async function listEntrepriseMissions(
  ref: string | number,
  params: { from?: string; to?: string; status?: Mission["status"] } = {}
): Promise<{ missions: (Mission & { slots?: Slot[] })[] }> {
  const query = new URLSearchParams(
    params as Record<string, string>
  ).toString();

  return request<{ missions: (Mission & { slots?: Slot[] })[] }>(
    `/api/entreprises/${ref}/missions${query ? `?${query}` : ""}`
  );
}

/**
 * ✏️ Mettre à jour une mission (owner uniquement)
 */
export async function updateEntrepriseMission(
  entrepriseId: number | string,
  missionId: number,
  updates: MissionUpdate
): Promise<{ mission: Mission & { slots?: Slot[] } }> {
  return request<{ mission: Mission & { slots?: Slot[] } }>(
    `/api/entreprises/${entrepriseId}/missions/${missionId}`,
    {
      method: "PUT",
      body: JSON.stringify(updates),
    }
  );
}

/**
 * ❌ Supprimer une mission (owner uniquement)
 */
export async function deleteEntrepriseMission(
  entrepriseId: number,
  missionId: number
): Promise<void> {
  await request(`/api/entreprises/${entrepriseId}/missions/${missionId}`, {
    method: "DELETE",
  });
}
