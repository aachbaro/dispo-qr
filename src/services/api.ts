// src/services/api.ts
export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  console.log("🌍 Fetch:", url, options.method || "GET", { headers });

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("❌ API error:", res.status, err);
    throw new Error(err.error || res.statusText);
  }

  return res.json();
}
