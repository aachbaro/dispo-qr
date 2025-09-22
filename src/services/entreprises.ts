// src/services/entreprises.ts
// -------------------------------------------------------------
// Services liés aux entreprises
//
// Fonctions disponibles :
//
// - listEntreprises() : retourne la liste publique de toutes les entreprises
// - createEntreprise(payload) : crée une entreprise (user connecté requis)
// - getEntrepriseBySlug(slug) : retourne une entreprise publique via son slug
// - updateEntreprise(id, updates) : met à jour une entreprise (owner uniquement)
//
// ⚠️ Remarque :
// - L’accès public se fait via le slug (lecture uniquement).
// - L’update doit idéalement se faire via l’ID ou user_id
//   (plus sûr que le slug qui peut changer).
// -------------------------------------------------------------

import { request } from "./api";

// ----------------------
// Types
// ----------------------
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

// ----------------------
// Services
// ----------------------

/**
 * 📜 Liste publique des entreprises
 */
export async function listEntreprises(): Promise<{ entreprises: Entreprise[] }> {
  return request<{ entreprises: Entreprise[] }>("/api/entreprises");
}

/**
 * ➕ Créer une entreprise (user connecté requis)
 */
export async function createEntreprise(
  payload: Omit<Entreprise, "id" | "created_at" | "updated_at" | "user_id">
): Promise<{ entreprise: Entreprise }> {
  return request<{ entreprise: Entreprise }>("/api/entreprises", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * 🔍 Récupérer une entreprise publique par son slug
 */
export async function getEntrepriseBySlug(
  slug: string
): Promise<{ data: Entreprise }> {
  return request<{ data: Entreprise }>(`/api/entreprises/${slug}`);
}

/**
 * ✏️ Mettre à jour une entreprise (owner uniquement)
 * ⚠️ Ici je propose de passer l'ID plutôt que le slug
 * pour plus de cohérence côté sécurité.
 */
export async function updateEntreprise(
  id: number,
  updates: Partial<Omit<Entreprise, "id" | "slug" | "created_at" | "updated_at">>
): Promise<{ data: Entreprise }> {
  return request<{ data: Entreprise }>(`/api/entreprises/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}
