// src/services/api.ts
export type Slot = {
  id: number;
  start: string; // timestamp ISO
  end: string; // timestamp ISO
  title: string;
  created_at: string;
};

const API_BASE = ""; // relatif = même domaine (Vercel)

// --- Helpers ---
function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("adminToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
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

// --- Auth ---
export async function login(password: string): Promise<string> {
  const data = await request<{ token: string }>("/api/login", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
  localStorage.setItem("adminToken", data.token);
  return data.token;
}

export function logout() {
  localStorage.removeItem("adminToken");
}

// --- Slots ---
// GET: récupérer la liste des créneaux
export async function getSlots(params?: { from: string; to: string }) {
  const qs =
    params?.from && params?.to
      ? `?from=${encodeURIComponent(params.from)}&to=${encodeURIComponent(
          params.to
        )}`
      : "";
  return request<{ slots: Slot[] }>(`/api/slots${qs}`);
}

// POST: créer un créneau
export async function createSlot(slot: Pick<Slot, "start" | "end" | "title">) {
  return request<{ slot: Slot }>("/api/slots", {
    method: "POST",
    body: JSON.stringify(slot),
  });
}

// PATCH: modifier un créneau existant
export async function updateSlot(id: number, updates: Partial<Slot>) {
  return request<{ slot: Slot }>(`/api/slots/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

// DELETE: supprimer un créneau
export async function deleteSlot(id: number) {
  return request<{ success: boolean }>(`/api/slots/${id}`, {
    method: "DELETE",
  });
}
