// src/services/missions.ts
// -------------------------------------------------------------
// Services liés aux missions d'une entreprise
//
// Fonctions disponibles :
// - createEntrepriseMission(entrepriseId, payload) : créer une mission (owner uniquement)
// - listEntrepriseMissions(ref, params?)           : lister les missions (public ou owner)
// - updateEntrepriseMission(entrepriseId, missionId, updates) : mettre à jour une mission
// - deleteEntrepriseMission(entrepriseId, missionId)          : supprimer une mission
//
// ⚠️ Notes :
// - Les routes API sont désormais unifiées : /api/entreprises/[ref]/missions
//   (ref = slug pour lecture publique, id pour accès owner).
// - Les contrôles d'accès (public vs privé) sont gérés côté API.
// -------------------------------------------------------------

import { request } from "./api";

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
  date_slot: string; // format ISO
  end_slot: string; // format ISO
}

export interface Mission extends MissionPayload {
  id: number;
  created_at: string;
  status:
    | "proposé"
    | "validé"
    | "réalisé"
    | "paiement_en_attente"
    | "payé"
    | "terminé"
    | "refusé";
  devis_url?: string;
  facture_url?: string;
  payment_link?: string;
}

export type MissionUpdate = Partial<MissionPayload> & {
  status?: Mission["status"];
  devis_url?: string;
  facture_url?: string;
  payment_link?: string;
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
