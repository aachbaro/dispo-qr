// src/services/users.ts
import { getAuthHeaders } from "./auth";

export interface UserProfile {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

export async function getMyProfile(): Promise<UserProfile> {
  const res = await fetch("/api/users/me", {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error("❌ Impossible de récupérer le profil");
  return res.json();
}
