// src/services/missions.ts
// -------------------------------------------------------------
// Services liés aux missions (entreprise & client)
// -------------------------------------------------------------
//
// 📌 Description :
//   - Liste les missions de l'utilisateur connecté (entreprise/client)
//   - Créé de nouvelles missions pour l'entreprise propriétaire
//   - Mise à jour / suppression via l'endpoint unifié /api/missions/[id]
//
// 📍 Endpoints API :
//   - GET    /api/missions             → missions de l'utilisateur
//   - POST   /api/missions             → créer une mission (+ slots)
//   - GET    /api/missions/[id]        → récupérer une mission
//   - PUT    /api/missions/[id]        → mettre à jour une mission
//   - DELETE /api/missions/[id]        → supprimer une mission
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
