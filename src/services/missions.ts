// src/services/missions.ts

/**
 * Types partagés pour les missions
 */
export interface MissionPayload {
  etablissement: string;
  etablissement_address?: string;
  contact_name?: string;
  contact_email: string;
  contact_phone: string;
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

/**
 * Helpers
 */
function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("adminToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(getAuthHeaders() ?? {}),
      ...(options.headers as Record<string, string>),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

/**
 * Services API Missions (par entreprise)
 */

// ➕ Créer une mission
export async function createEntrepriseMission(
  slug: string,
  payload: MissionPayload
): Promise<{ mission: Mission }> {
  return request<{ mission: Mission }>(`/api/entreprises/${slug}/missions`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// 📜 Lister les missions d’une entreprise
export async function listEntrepriseMissions(
  slug: string,
  params: { from?: string; to?: string; status?: Mission["status"] } = {}
): Promise<{ missions: Mission[] }> {
  const query = new URLSearchParams(
    params as Record<string, string>
  ).toString();
  return request<{ missions: Mission[] }>(
    `/api/entreprises/${slug}/missions${query ? `?${query}` : ""}`
  );
}

// ✏️ Mettre à jour une mission
export async function updateEntrepriseMission(
  slug: string,
  id: number,
  updates: MissionUpdate
): Promise<{ mission: Mission }> {
  return request<{ mission: Mission }>(
    `/api/entreprises/${slug}/missions/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(updates),
    }
  );
}

// ❌ Supprimer une mission
export async function deleteEntrepriseMission(
  slug: string,
  id: number
): Promise<void> {
  await request(`/api/entreprises/${slug}/missions/${id}`, {
    method: "DELETE",
  });
}
