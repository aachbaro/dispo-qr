// src/services/templates.ts
// -------------------------------------------------------------
// Services liés aux modèles de mission (mission_templates)
// -------------------------------------------------------------
//
// 📌 Description :
//   - Fournit les appels API pour gérer les modèles de mission côté client
//
// 📍 Fonctions :
//   - listTemplates(clientId)      → liste des modèles d’un client
//   - createTemplate(clientId, p)  → crée un modèle pour ce client
//   - updateTemplate(id, updates)  → met à jour un modèle
//   - deleteTemplate(id)           → supprime un modèle
//
// 🔒 Règles d’accès :
//   - Seul le client propriétaire peut gérer ses modèles
// -------------------------------------------------------------

import { request } from "./api";
import type { Tables, TablesInsert, TablesUpdate } from "../../types/database";

export type MissionTemplate = Tables<"mission_templates">;
export type MissionTemplateInsert = TablesInsert<"mission_templates">;
export type MissionTemplateUpdate = TablesUpdate<"mission_templates">;

/**
 * 📋 Liste des modèles du client connecté
 */
export async function listTemplates(): Promise<{
  templates: MissionTemplate[];
}> {
  return request<{ templates: MissionTemplate[] }>(`/api/clients/templates`);
}

/**
 * ➕ Créer un modèle
 */
export async function createTemplate(
  payload: MissionTemplateInsert
): Promise<{ template: MissionTemplate }> {
  return request<{ template: MissionTemplate }>(`/api/clients/templates`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * ✏️ Mettre à jour un modèle
 */
export async function updateTemplate(
  id: number,
  updates: MissionTemplateUpdate
): Promise<{ template: MissionTemplate }> {
  return request<{ template: MissionTemplate }>(
    `/api/clients/templates/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(updates),
    }
  );
}

/**
 * ❌ Supprimer un modèle
 */
export async function deleteTemplate(id: number): Promise<{ success: true }> {
  return request<{ success: true }>(`/api/clients/templates/${id}`, {
    method: "DELETE",
  });
}
