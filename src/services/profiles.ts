// src/services/profiles.ts
// -------------------------------------------------------------
// Services liés aux profils utilisateurs
// -------------------------------------------------------------
//
// 📌 Description :
//   - Fournit l’accès aux infos du user connecté
//
// 📍 Fonctions :
//   - getMyProfile() → retourne les infos du profil connecté
//
// ⚠️ Remarques :
//   - Typage basé sur types/database.ts
//   - Différence entre auth.users (Supabase) et profiles (table publique)
// -------------------------------------------------------------

import { request } from "./api";
import type { Tables } from "../../types/database";

export type Profile = Tables<"profiles">;

/**
 * 🔍 Récupérer le profil du user connecté
 */
export async function getMyProfile(): Promise<Profile> {
  return request<Profile>("/api/profiles/me");
}
