// src/services/api.ts
export type Slot = {
  id: string;
  start_at: string;
  end_at: string;
  status: "free" | "blocked" | "booked";
  note?: string;
  created_at: string;
  updated_at: string;
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
export async function getSlots(params?: {
  from?: string;
  to?: string;
  status?: string;
}) {
  const qs = new URLSearchParams(params as Record<string, string>).toString();
  return request<{ slots: Slot[] }>(`/api/slots${qs ? `?${qs}` : ""}`);
}

export async function createSlot(
  slot: Pick<Slot, "start_at" | "end_at" | "status" | "note">
) {
  return request<{ slot: Slot }>("/api/slots", {
    method: "POST",
    body: JSON.stringify(slot),
  });
}

export async function updateSlot(id: string, updates: Partial<Slot>) {
  return request<{ slot: Slot }>(`/api/slots/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function deleteSlot(id: string) {
  return request<{ success: boolean }>(`/api/slots/${id}`, {
    method: "DELETE",
  });
}
