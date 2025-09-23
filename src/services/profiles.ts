// src/services/profiles.ts
// -------------------------------------------------------------
// Services liés aux profils utilisateurs
//
// Fonctions disponibles :
// - getMyProfile() : retourne les infos du user connecté
// -------------------------------------------------------------

import { request } from "./api";

export interface UserProfile {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

/**
 * 🔍 Récupérer le profil du user connecté
 */
export async function getMyProfile(): Promise<UserProfile> {
  return request<UserProfile>("/api/profiles/me");
}
