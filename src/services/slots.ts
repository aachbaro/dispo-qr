// src/services/slots.ts

/**
 * Types pour les slots
 */
export interface Slot {
  id: number;
  start: string; // timestamp ISO
  end: string; // timestamp ISO
  title: string;
  created_at: string;
  entreprise_id: number;
}

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
 * Services API Slots (par entreprise)
 */

// 📜 Récupérer les slots d’une entreprise
export async function getEntrepriseSlots(
  slug: string,
  params?: { from?: string; to?: string }
): Promise<{ slots: Slot[] }> {
  const qs =
    params?.from && params?.to
      ? `?from=${encodeURIComponent(params.from)}&to=${encodeURIComponent(
          params.to
        )}`
      : "";
  return request<{ slots: Slot[] }>(`/api/entreprises/${slug}/slots${qs}`);
}

// ➕ Créer un slot pour une entreprise
export async function createEntrepriseSlot(
  slug: string,
  slot: Pick<Slot, "start" | "end" | "title">
): Promise<{ slot: Slot }> {
  return request<{ slot: Slot }>(`/api/entreprises/${slug}/slots`, {
    method: "POST",
    body: JSON.stringify(slot),
  });
}

// ✏️ Mettre à jour un slot
export async function updateEntrepriseSlot(
  slug: string,
  id: number,
  updates: Partial<Slot>
): Promise<{ slot: Slot }> {
  return request<{ slot: Slot }>(`/api/entreprises/${slug}/slots/${id}`, {
    method: "PUT", // cohérent avec l’API
    body: JSON.stringify(updates),
  });
}

// ❌ Supprimer un slot
export async function deleteEntrepriseSlot(
  slug: string,
  id: number
): Promise<void> {
  await request(`/api/entreprises/${slug}/slots/${id}`, {
    method: "DELETE",
  });
}
