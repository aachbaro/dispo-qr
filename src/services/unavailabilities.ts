// src/services/unavailabilities.ts
// -------------------------------------------------------------
// Service : Unavailabilities (indisponibilités récurrentes)
// -------------------------------------------------------------
//
// 📌 Description :
//   - Interagit avec les endpoints API d’indisponibilités
//   - Fournit des fonctions CRUD pour le frontend
//
// 📍 Endpoints :
//   - GET    /api/entreprises/[ref]/unavailabilities?start&end
//   - POST   /api/entreprises/[ref]/unavailabilities
//   - PUT    /api/entreprises/[ref]/unavailabilities/[id]
//   - DELETE /api/entreprises/[ref]/unavailabilities/[id]
//
// 🔒 Accès :
//   - Réservé owner/admin (GET + POST + PUT + DELETE)
//
// ⚠️ Remarques :
//   - Le frontend utilise ces fonctions pour afficher ou gérer
//     les indisponibilités dans l’agenda (vue admin uniquement)
// -------------------------------------------------------------

import { request } from "./api";
import type { Tables, TablesInsert, TablesUpdate } from "../../types/database";

// ----------------------
// Types
// ----------------------
export type Unavailability = Tables<"unavailabilities">;
export type UnavailabilityInsert = TablesInsert<"unavailabilities">;
export type UnavailabilityUpdate = TablesUpdate<"unavailabilities">;

// ----------------------
// GET → liste des indisponibilités dans une période donnée
// ----------------------
export async function getUnavailabilities(
  entrepriseRef: string,
  start: string,
  end: string
): Promise<Unavailability[]> {
  const { unavailabilities } = await request<{ unavailabilities: Unavailability[] }>(
    `/api/entreprises/${entrepriseRef}/unavailabilities?start=${start}&end=${end}`
  );
  return unavailabilities ?? [];
}

// ----------------------
// POST → création d’une nouvelle indisponibilité
// ----------------------
export async function createUnavailability(
  slug: string,
  payload: Partial<UnavailabilityInsert>
): Promise<{ unavailability: Unavailability }> {
  return await request<{ unavailability: Unavailability }>(
    `/api/entreprises/${slug}/unavailabilities`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

// ----------------------
// PUT → mise à jour d’une indisponibilité existante
// ----------------------
export async function updateUnavailability(
  entrepriseRef: string,
  id: number,
  payload: Partial<UnavailabilityUpdate>
): Promise<Unavailability> {
  const { unavailability } = await request<{ unavailability: Unavailability }>(
    `/api/entreprises/${entrepriseRef}/unavailabilities/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  );
  return unavailability;
}

// ----------------------
// DELETE → suppression d’une indisponibilité
// ----------------------
export async function deleteUnavailability(
  entrepriseRef: string,
  id: number
): Promise<void> {
  await request(`/api/entreprises/${entrepriseRef}/unavailabilities/${id}`, {
    method: "DELETE",
  });
}
