/**
 * src/api.ts
 * Layer  : Frontend — client HTTP
 * Role   : Toutes les fonctions d'appel à l'API Django v2.
 *          Gère l'en-tête Authorization: Token pour les actions authentifiées.
 *          Exporte aussi les helpers OIDC (URLs de login/logout).
 */

import { mockGoogleLogin, mockLogin, mockRegister } from "./lib/mockApi";
import type {
  AdminAccountDetailResponse,
  AdminOverviewResponse,
  AccountRole,
  AuthResponse,
  AuthUser,
  Facture,
  FactureStatus,
  FreelancerProfile,
  Mission,
  MissionStatus,
  ProfileOverview,
  Skill,
  Slot,
  Unavailability,
} from "./types";

// Re-export AuthUser so pages that already import from "./api" keep working
export type { AuthUser, AuthResponse };

const API_URL = (import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8002/api").replace(/\/$/, "");
const AUTH_SERVER_URL = (import.meta.env.VITE_AUTH_SERVER_URL ?? "https://auth.pascuans.dev").replace(/\/$/, "");

export const isMockApiEnabled = import.meta.env.VITE_USE_MOCK_API === "true";
export const showLocalDebugAuth =
  import.meta.env.DEV || import.meta.env.VITE_SHOW_LOCAL_DEBUG_AUTH === "true";

export function getDefaultAppPath(user: Pick<AuthUser, "role" | "slug">): string {
  if (user.role === "admin") return "/admin";
  if (user.role === "client") return "/client";
  return user.slug ? `/p/${user.slug}` : "/profile";
}

// ---------------------------------------------------------------------------
// OIDC helpers
// ---------------------------------------------------------------------------

export function getOidcLoginUrl(): string {
  return `${API_URL}/auth/social/login/pascuans_oidc/`;
}

export function getOidcRegisterUrl(): string {
  return `${AUTH_SERVER_URL}/register/?next=${encodeURIComponent(getOidcLoginUrl())}`;
}

export function getOidcForgotPasswordUrl(nextUrl?: string): string {
  if (!nextUrl) return `${AUTH_SERVER_URL}/forgot-password/`;
  return `${AUTH_SERVER_URL}/forgot-password/?next=${encodeURIComponent(nextUrl)}`;
}

export function getOidcLogoutUrl(nextUrl: string): string {
  return `${API_URL}/auth/social/logout/?next=${encodeURIComponent(nextUrl)}`;
}

// ---------------------------------------------------------------------------
// Helpers HTTP
// ---------------------------------------------------------------------------

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = await response.json();
    if (typeof payload.detail === "string") return payload.detail;
    if (typeof payload.error === "string") return payload.error;
    if (typeof payload.message === "string") return payload.message;
    if (payload && typeof payload === "object") {
      const messages: string[] = [];
      for (const value of Object.values(payload)) {
        if (typeof value === "string") { messages.push(value); continue; }
        if (Array.isArray(value)) {
          for (const e of value) { if (typeof e === "string") messages.push(e); }
        }
      }
      if (messages.length > 0) return messages.join(" ");
    }
  } catch { /* fall through */ }
  return "Une erreur est survenue.";
}

function authHeaders(token?: string | null): Record<string, string> {
  return token ? { Authorization: `Token ${token}` } : {};
}

async function postJson<T>(path: string, body: object, token?: string | null): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XmlHttpRequest",
        ...authHeaders(token),
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        `Impossible de joindre l'API ExtraBeam sur ${API_URL}. Verifie que le backend Django tourne bien.`
      );
    }
    throw error;
  }
  if (!response.ok) throw new Error(await readErrorMessage(response));
  return (await response.json()) as T;
}

async function patchJson<T>(path: string, body: object, token: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await readErrorMessage(response));
  return (await response.json()) as T;
}

async function getJson<T>(path: string, token?: string | null): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { ...authHeaders(token) },
  });
  if (!response.ok) throw new Error(await readErrorMessage(response));
  return (await response.json()) as T;
}

async function deleteReq(path: string, token: string): Promise<void> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "DELETE",
    headers: { ...authHeaders(token) },
  });
  if (!response.ok && response.status !== 204) {
    throw new Error(await readErrorMessage(response));
  }
}

// ---------------------------------------------------------------------------
// Auth — local / Google
// ---------------------------------------------------------------------------

export async function login(email: string, password: string): Promise<AuthResponse> {
  if (isMockApiEnabled) return mockLogin(email, password);
  return postJson<AuthResponse>("/auth/login/", { email, password });
}

export async function register(
  display_name: string,
  email: string,
  password: string,
  role: AccountRole,
): Promise<AuthResponse> {
  if (isMockApiEnabled) return mockRegister(display_name, email, password);
  return postJson<AuthResponse>("/auth/register/", { display_name, email, password, role });
}

export async function googleLogin(code: string): Promise<AuthResponse> {
  if (isMockApiEnabled) return mockGoogleLogin(code);
  return postJson<AuthResponse>("/auth/google/", { code });
}

// ---------------------------------------------------------------------------
// Profil
// ---------------------------------------------------------------------------

export async function fetchProfileOverview(slug: string, token?: string | null): Promise<ProfileOverview> {
  return getJson<ProfileOverview>(`/profiles/${slug}/`, token);
}

export async function updateProfile(
  slug: string,
  data: Partial<
    Pick<FreelancerProfile, "display_name" | "avatar_url" | "job_title" | "location" | "bio" | "phone">
  > & {
    avatar_upload_data?: string;
    avatar_remove?: boolean;
  },
  token: string
): Promise<FreelancerProfile> {
  return patchJson<FreelancerProfile>(`/profiles/${slug}/`, data, token);
}

// ---------------------------------------------------------------------------
// Skills
// ---------------------------------------------------------------------------

export async function addSkill(slug: string, name: string, token: string): Promise<Skill> {
  return postJson<Skill>(`/profiles/${slug}/skills/`, { name }, token);
}

export async function deleteSkill(slug: string, skillId: number, token: string): Promise<void> {
  return deleteReq(`/profiles/${slug}/skills/${skillId}/`, token);
}

// ---------------------------------------------------------------------------
// Slots
// ---------------------------------------------------------------------------

export async function fetchSlots(slug: string, from: string, to: string, token?: string | null): Promise<Slot[]> {
  return getJson<Slot[]>(`/profiles/${slug}/slots/?from=${from}&to=${to}`, token);
}

export async function createSlot(
  slug: string,
  data: { title: string; start: string; end: string; mission_id?: number | null },
  token: string
): Promise<Slot> {
  return postJson<Slot>(`/profiles/${slug}/slots/`, data, token);
}

export async function updateSlot(
  slug: string,
  slotId: number,
  data: Partial<{ title: string; start: string; end: string; mission_id: number | null }>,
  token: string
): Promise<Slot> {
  return patchJson<Slot>(`/profiles/${slug}/slots/${slotId}/`, data, token);
}

export async function deleteSlot(slug: string, slotId: number, token: string): Promise<void> {
  return deleteReq(`/profiles/${slug}/slots/${slotId}/`, token);
}

// ---------------------------------------------------------------------------
// Unavailabilities
// ---------------------------------------------------------------------------

export async function fetchUnavailabilities(slug: string, token?: string | null): Promise<Unavailability[]> {
  return getJson<Unavailability[]>(`/profiles/${slug}/unavailabilities/`, token);
}

export async function createUnavailability(
  slug: string,
  data: Partial<Omit<Unavailability, "id">>,
  token: string
): Promise<Unavailability> {
  return postJson<Unavailability>(`/profiles/${slug}/unavailabilities/`, data, token);
}

export async function updateUnavailability(
  slug: string,
  unavailabilityId: number,
  data: Partial<Omit<Unavailability, "id">>,
  token: string
): Promise<Unavailability> {
  return patchJson<Unavailability>(`/profiles/${slug}/unavailabilities/${unavailabilityId}/`, data, token);
}

export async function deleteUnavailability(
  slug: string,
  unavailabilityId: number,
  token: string,
  exceptionDate?: string   // YYYY-MM-DD → supprime une seule occurrence
): Promise<Unavailability | void> {
  const qs = exceptionDate ? `?exception=${exceptionDate}` : "";
  if (exceptionDate) {
    return patchJson<Unavailability>(
      `/profiles/${slug}/unavailabilities/${unavailabilityId}/${qs}`,
      {},
      token
    );
  }
  return deleteReq(`/profiles/${slug}/unavailabilities/${unavailabilityId}/`, token);
}

// ---------------------------------------------------------------------------
// Missions
// ---------------------------------------------------------------------------

export async function fetchMissions(slug: string, token: string, status?: MissionStatus): Promise<Mission[]> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  return getJson<Mission[]>(`/profiles/${slug}/missions/${qs}`, token);
}

export async function createMission(
  slug: string,
  data: Partial<Omit<Mission, "id" | "created_at" | "updated_at">>,
  token: string
): Promise<Mission> {
  return postJson<Mission>(`/profiles/${slug}/missions/`, data, token);
}

export async function updateMission(
  slug: string,
  missionId: number,
  data: Partial<Omit<Mission, "id" | "created_at" | "updated_at">>,
  token: string
): Promise<Mission> {
  return patchJson<Mission>(`/profiles/${slug}/missions/${missionId}/`, data, token);
}

export async function deleteMission(slug: string, missionId: number, token: string): Promise<void> {
  return deleteReq(`/profiles/${slug}/missions/${missionId}/`, token);
}

// ---------------------------------------------------------------------------
// Factures
// ---------------------------------------------------------------------------

export interface FacturePayload {
  mission_id?: number | null;
  numero: string;
  date_emission: string;
  status?: FactureStatus;
  client_name: string;
  client_address_ligne1?: string;
  client_address_ligne2?: string;
  client_code_postal?: string;
  client_ville?: string;
  client_pays?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  description?: string;
  hours?: string | null;
  rate?: string | null;
  montant_ht: string;
  tva?: string;
  montant_ttc: string;
  mention_tva?: string;
  conditions_paiement?: string;
  penalites_retard?: string;
}

export async function fetchFactures(
  slug: string,
  token: string,
  status?: FactureStatus
): Promise<Facture[]> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  return getJson<Facture[]>(`/profiles/${slug}/factures/${qs}`, token);
}

export async function createFacture(
  slug: string,
  data: FacturePayload,
  token: string
): Promise<Facture> {
  return postJson<Facture>(`/profiles/${slug}/factures/`, data, token);
}

export async function updateFacture(
  slug: string,
  factureId: number,
  data: Partial<FacturePayload>,
  token: string
): Promise<Facture> {
  return patchJson<Facture>(`/profiles/${slug}/factures/${factureId}/`, data, token);
}

export async function deleteFacture(slug: string, factureId: number, token: string): Promise<void> {
  return deleteReq(`/profiles/${slug}/factures/${factureId}/`, token);
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export async function fetchAdminOverview(
  token: string,
  filters?: { q?: string; role?: AccountRole | "" | null }
): Promise<AdminOverviewResponse> {
  const params = new URLSearchParams();
  if (filters?.q) params.set("q", filters.q);
  if (filters?.role) params.set("role", filters.role);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return getJson<AdminOverviewResponse>(`/admin/overview/${suffix}`, token);
}

export async function fetchAdminAccountDetail(
  accountId: number | string,
  token: string
): Promise<AdminAccountDetailResponse> {
  return getJson<AdminAccountDetailResponse>(`/admin/accounts/${accountId}/`, token);
}
