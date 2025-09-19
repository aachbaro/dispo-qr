import { request } from "./api";

export interface Slot {
  id: number;
  start: string;
  end: string;
  title: string;
  created_at: string;
  entreprise_id: number;
}

// 📜 Liste
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

// ➕ Create
export async function createEntrepriseSlot(
  slug: string,
  slot: Pick<Slot, "start" | "end" | "title">
): Promise<{ slot: Slot }> {
  return request<{ slot: Slot }>(`/api/entreprises/${slug}/slots`, {
    method: "POST",
    body: JSON.stringify(slot),
  });
}

// ✏️ Update
export async function updateEntrepriseSlot(
  slug: string,
  id: number,
  updates: Partial<Slot>
): Promise<{ slot: Slot }> {
  return request<{ slot: Slot }>(`/api/entreprises/${slug}/slots/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

// ❌ Delete
export async function deleteEntrepriseSlot(
  slug: string,
  id: number
): Promise<void> {
  await request(`/api/entreprises/${slug}/slots/${id}`, { method: "DELETE" });
}
