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
// -------------------------------------------------------------

import { request } from "./api";
import type { Slot } from "./slots";

// ----------------------
// Types
// ----------------------
export interface MissionPayload {
  etablissement: string;

  // Adresse normalisée
  etablissement_adresse_ligne1: string;
  etablissement_adresse_ligne2?: string;
  etablissement_ville: string;
  etablissement_code_postal: string;
  etablissement_pays?: string;

  // Contact
  contact_name?: string;
  contact_email: string;
  contact_phone: string;

  // Infos mission
  instructions?: string;
  mode: "freelance" | "salarié";

  // Créneaux liés
  slots: Array<Pick<Slot, "start" | "end" | "title">>;
}

export interface Mission extends Omit<MissionPayload, "slots"> {
  id: number;
  created_at: string;
  status:
    | "proposed"
    | "validated"
    | "pending_payment"
    | "paid"
    | "completed"
    | "refused"
    | "realized";

  // Slots associés à la mission
  slots?: Slot[];
}

export type MissionUpdate = Partial<MissionPayload> & {
  status?: Mission["status"];
};

// ----------------------
// Services Missions
// ----------------------

/**
 * ➕ Créer une mission (owner uniquement)
 * @param entrepriseId - id numérique de l’entreprise
 * @param payload - infos mission + slots
 */
export async function createEntrepriseMission(
  entrepriseId: number,
  payload: MissionPayload
): Promise<{ mission: Mission }> {
  return request<{ mission: Mission }>(
    `/api/entreprises/${entrepriseId}/missions`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

/**
 * 📜 Lister les missions d’une entreprise
 * @param ref - id (number) ou slug (string) de l’entreprise
 * @param params - filtres optionnels (from, to, status)
 */
export async function listEntrepriseMissions(
  ref: string | number,
  params: { from?: string; to?: string; status?: Mission["status"] } = {}
): Promise<{ missions: Mission[] }> {
  const query = new URLSearchParams(
    params as Record<string, string>
  ).toString();

  return request<{ missions: Mission[] }>(
    `/api/entreprises/${ref}/missions${query ? `?${query}` : ""}`
  );
}

/**
 * ✏️ Mettre à jour une mission (owner uniquement)
 */
export async function updateEntrepriseMission(
  entrepriseId: number,
  missionId: number,
  updates: MissionUpdate
): Promise<{ mission: Mission }> {
  return request<{ mission: Mission }>(
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
