// src/services/missions.ts
// -------------------------------------------------------------
// Services liés aux missions (entreprise & client)
// -------------------------------------------------------------
//
// 📌 Description :
//   - Liste les missions de l'utilisateur connecté (entreprise/client)
//   - Créé de nouvelles missions pour l'entreprise propriétaire
//   - Opérations de mise à jour/suppression conservées sur les routes historiques
//
// 📍 Endpoints API :
//   - GET    /api/missions                       → missions de l'utilisateur
//   - POST   /api/missions                       → créer une mission (+ slots)
//   - PUT    /api/entreprises/[ref]/missions/[id]   → mettre à jour une mission
//   - DELETE /api/entreprises/[ref]/missions/[id]   → supprimer une mission
//
// 🔒 Règles d’accès :
//   - Clients : lecture seule (missions où client_id = user.id)
//   - Entreprises/Admin : accès missions entreprise + création
//
// ⚠️ Remarques :
//   - Les slots sont envoyés dans `slots` (table dédiée)
//   - Typage basé sur types/database.ts généré via Supabase
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

export type MissionWithRelations = Mission & {
  slots?: Slot[];
  entreprise_slug?: string | null;
};

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
export async function createMission(
  payload: MissionPayload
): Promise<{ mission: MissionWithRelations }> {
  return request<{ mission: MissionWithRelations }>("/api/missions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * 📜 Lister les missions d’une entreprise
 */
export async function listMissions(
  params: { status?: Mission["status"] } = {}
): Promise<{ missions: MissionWithRelations[] }> {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set("status", params.status);

  const query = searchParams.toString();

  return request<{ missions: MissionWithRelations[] }>(
    `/api/missions${query ? `?${query}` : ""}`
  );
}

/**
 * ✏️ Mettre à jour une mission (owner uniquement)
 */
export async function updateMission(
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
export async function deleteMission(
  entrepriseId: number,
  missionId: number
): Promise<void> {
  await request(`/api/entreprises/${entrepriseId}/missions/${missionId}`, {
    method: "DELETE",
  });
}
