// src/services/auth.ts
export type UserRole = "freelance" | "client" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  slug?: string; // 👈 pour les freelances avec entreprise
}

const API_BASE = "";

// --- Helpers ---
function saveToken(token: string) {
  localStorage.setItem("authToken", token);
}

function saveUser(user: AuthUser) {
  localStorage.setItem("authUser", JSON.stringify(user));
}

export function getToken(): string | null {
  return localStorage.getItem("authToken");
}

export function getUser(): AuthUser | null {
  const raw = localStorage.getItem("authUser");
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}

export function clearAuth() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("authUser");
}

export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// --- API calls ---
export async function register(payload: {
  email: string;
  password: string;
  role: UserRole;
  entreprise?: {
    nom: string;
    prenom: string;
  };
}) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("❌ Erreur inscription");

  const data = await res.json();

  // ✅ Stockage
  saveToken(data.token);

  const user: AuthUser = {
    ...data.user,
    slug: data.user.slug ?? undefined, // 👈 slug récupéré directement
  };
  saveUser(user);

  return { user, token: data.token, entreprise: data.entreprise };
}

export async function login(
  email: string,
  password: string
): Promise<{ user: AuthUser; token: string }> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) throw new Error("❌ Erreur connexion");
  const data = await res.json();

  // ✅ Stockage
  saveToken(data.token);
  const user: AuthUser = {
    ...data.user,
    slug: data.user.slug ?? undefined, // 👈 correction ici
  };
  saveUser(user);

  return { user, token: data.token };
}

export function logout() {
  clearAuth();
}
