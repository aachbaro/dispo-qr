/**
 * src/types.ts
 * Layer  : Frontend — types partagés
 * Role   : Définit les interfaces TypeScript métier utilisées dans toute l'app.
 *          Correspond aux réponses de l'API Django v2.
 */

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export type AccountRole = "freelance" | "client" | "admin";

export interface AuthUser {
  id: string;
  slug: string | null;
  email: string;
  display_name: string;
  avatar_url: string | null;
  role: AccountRole;
  auth_provider?: string;
  oidc_sub?: string | null;
  token?: string | null;
}

export interface AuthResponse {
  user: AuthUser;
  access_token: string;
}

// ---------------------------------------------------------------------------
// Profil freelance
// ---------------------------------------------------------------------------

export interface Skill {
  id: number;
  name: string;
}

export interface Experience {
  id: number;
  title: string;
  company: string;
  start_date: string | null;
  end_date: string | null;
  description: string;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface FreelancerProfile {
  id: string;
  slug: string;
  display_name: string;
  avatar_url: string | null;
  role: AccountRole;
  job_title: string;
  location: string;
  bio: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  postal_code: string;
  city: string;
  country: string;
  siret: string;
  legal_status: string;
  vat_number: string;
  vat_notice: string;
  iban: string;
  bic: string;
  hourly_rate: string | null;
  currency: string;
  payment_terms: string;
  late_penalties: string;
  email: string;
  skills: Skill[];
  experiences: Experience[];
}

export interface ProfileOverview {
  profile: FreelancerProfile;
  unavailabilities: Unavailability[];
  mode: "owner" | "public";
}

// ---------------------------------------------------------------------------
// Agenda
// ---------------------------------------------------------------------------

export interface Slot {
  id: number;
  title: string;
  start: string;           // ISO datetime "2026-04-08T10:00:00Z"
  end: string;
  mission_id: number | null;
  mission_title: string | null;
}

export interface Unavailability {
  id: number;
  recurrence_type: "once" | "weekly";
  weekday: number | null;  // 1=Lundi … 7=Dimanche
  start_date: string | null;
  start_time: string;      // "HH:MM:SS"
  end_time: string;
  recurrence_end: string | null;
  exceptions: string[];
}

// ---------------------------------------------------------------------------
// Missions
// ---------------------------------------------------------------------------

export type MissionStatus = "proposée" | "en_cours" | "terminée" | "refusée";

export interface Mission {
  id: number;
  title: string;
  description: string;
  status: MissionStatus;
  notes: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_company: string;
  daily_rate: string | null;   // DecimalField → string côté API
  total_amount: string | null;
  start_date: string | null;   // "YYYY-MM-DD"
  end_date: string | null;
  slot_count: number;          // calculé par le backend
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Factures
// ---------------------------------------------------------------------------

export type FactureStatus = "pending_payment" | "paid" | "canceled";

export interface Facture {
  id: number;
  mission_id: number | null;
  mission_title: string | null;
  numero: string;
  date_emission: string;
  status: FactureStatus;
  client_name: string;
  client_address_ligne1: string;
  client_address_ligne2: string;
  client_code_postal: string;
  client_ville: string;
  client_pays: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  description: string;
  hours: string | null;
  rate: string | null;
  montant_ht: string;
  tva: string;
  montant_ttc: string;
  mention_tva: string;
  conditions_paiement: string;
  penalites_retard: string;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export interface AdminOverviewSummary {
  total_accounts: number;
  freelance_accounts: number;
  client_accounts: number;
  admin_accounts: number;
  total_skills: number;
  total_slots: number;
  total_unavailabilities: number;
  total_missions: number;
}

export interface AdminAccountSummary {
  id: number;
  slug: string | null;
  display_name: string;
  avatar_url: string | null;
  role: AccountRole;
  auth_provider: string;
  job_title: string;
  location: string;
  email: string;
  skill_count: number;
  slot_count: number;
  mission_count: number;
  unavailability_count: number;
  created_at: string;
  updated_at: string;
}

export interface AdminAccountDetail {
  id: number;
  slug: string | null;
  display_name: string;
  avatar_url: string | null;
  role: AccountRole;
  auth_provider: string;
  google_sub: string | null;
  oidc_sub: string | null;
  job_title: string;
  location: string;
  bio: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  postal_code: string;
  city: string;
  country: string;
  siret: string;
  legal_status: string;
  vat_number: string;
  vat_notice: string;
  iban: string;
  bic: string;
  hourly_rate: string | null;
  currency: string;
  payment_terms: string;
  late_penalties: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface AdminAccountStats {
  skill_count: number;
  slot_count: number;
  mission_count: number;
  unavailability_count: number;
}

export interface AdminOverviewResponse {
  summary: AdminOverviewSummary;
  accounts: AdminAccountSummary[];
  filters: {
    q: string;
    role: AccountRole | null;
  };
}

export interface AdminAccountDetailResponse {
  account: AdminAccountDetail;
  stats: AdminAccountStats;
  skills: Skill[];
  slots: Slot[];
  missions: Mission[];
  unavailabilities: Unavailability[];
}
