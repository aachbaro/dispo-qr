// src/services/missions.ts
// -------------------------------------------------------------
// Services liés aux missions (entreprise & client)
// -------------------------------------------------------------
//
// 📌 Description :
//   - Liste et crée des missions (publiques et authentifiées)
//   - Gère également la mise à jour / suppression
//
// 📍 Endpoints API :
//   - GET    /api/missions             → missions de l'utilisateur connecté
//   - POST   /api/missions             → création authentifiée
//   - POST   /api/missions/public      → création publique (visiteurs)
//   - GET    /api/missions/[id]        → récupérer une mission
//   - PUT    /api/missions/[id]        → mettre à jour une mission
//   - DELETE /api/missions/[id]        → supprimer une mission
//
// 🔒 Règles d’accès :
//   - Auth requis sauf pour `/public`
//   - Slots liés à la mission envoyés via `slots`
//
// -------------------------------------------------------------

import { request } from "./api";
import type { Tables, TablesInsert, TablesUpdate } from "../types/database";
import type { Slot } from "./slots";

// ----------------------
// Types
// ----------------------

export type Mission = Tables<"missions">;
export type MissionInsert = TablesInsert<"missions">;
export type MissionUpdate = TablesUpdate<"missions">;

export type MissionWithRelations = Mission & {
  slots?: Slot[];
  entreprise?: Tables<"entreprise"> | null;
  client?: Tables<"clients"> | null;
};

// Payload enrichi côté frontend : ajoute les slots liés
export type MissionPayload = MissionInsert & {
  slots: Array<Pick<Slot, "start" | "end" | "title">>;
  entreprise_ref?: string; // ⚡ permet de passer le slug d'entreprise
};

// ----------------------
// Services Missions
// ----------------------

/**
 * ➕ Créer une mission (authentifiée)
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
 * 🌍 Créer une mission publique (visiteur non connecté)
 */
export async function createPublicMission(
  payload: MissionPayload
): Promise<{ mission: MissionWithRelations }> {
  return request<{ mission: MissionWithRelations }>("/api/missions/public", {
    method: "POST",
    body: JSON.stringify(payload),
    skipAuth: true, // ⬅️ très important
  });
}

/**
 * 📜 Lister les missions de l’utilisateur connecté
 */
export async function listMissions(
  params: { status?: Mission["status"] } = {}
): Promise<{ missions: MissionWithRelations[] }> {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set("status", params.status);

  const query = searchParams.toString();

  return request<{ missions: MissionWithRelations[] }>(
    `/api/missions${query ? `?${query}` : ""}`,
    {
      skipAuth: false,
    }
  );
}

/**
 * ✏️ Mettre à jour une mission (owner uniquement)
 */
export async function updateMission(
  missionId: number,
  updates: MissionUpdate
): Promise<{ mission: MissionWithRelations }> {
  return request<{ mission: MissionWithRelations }>(
    `/api/missions/${missionId}`,
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
  _entrepriseId: number,
  missionId: number
): Promise<void> {
  await request(`/api/missions/${missionId}`, {
    method: "DELETE",
  });
}
