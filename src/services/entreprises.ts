import { request } from "./api";

export interface Entreprise {
  id: number;
  user_id?: string;
  nom: string;
  prenom: string;
  adresse: string;
  email: string;
  telephone?: string;
  siret: string;
  statut_juridique: string;
  tva_intracom?: string;
  mention_tva: string;
  iban: string;
  bic: string;
  taux_horaire: number;
  devise: string;
  conditions_paiement: string;
  penalites_retard: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

// 📜 Liste publique
export async function listEntreprises(): Promise<{
  entreprises: Entreprise[];
}> {
  return request<{ entreprises: Entreprise[] }>("/api/entreprises");
}

// ➕ Créer (user connecté uniquement)
export async function createEntreprise(
  payload: Omit<Entreprise, "id" | "created_at" | "updated_at" | "user_id">
): Promise<{ entreprise: Entreprise }> {
  return request<{ entreprise: Entreprise }>("/api/entreprises", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// 🔍 Par slug
export async function getEntrepriseBySlug(
  slug: string
): Promise<{ data: Entreprise }> {
  return request<{ data: Entreprise }>(`/api/entreprises/${slug}`);
}

// ✏️ Update (owner uniquement)
export async function updateEntreprise(
  slug: string,
  updates: Partial<Omit<Entreprise, "id" | "slug" | "created_at">>
): Promise<{ data: Entreprise }> {
  return request<{ data: Entreprise }>(`/api/entreprises/${slug}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}
