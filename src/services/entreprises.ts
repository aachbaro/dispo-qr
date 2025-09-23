// src/services/entreprises.ts
// -------------------------------------------------------------
// Services liés aux entreprises
//
// Fonctions disponibles :
// - listEntreprises()                : retourne la liste publique de toutes les entreprises
// - createEntreprise(payload)        : crée une entreprise (user connecté requis)
// - getEntreprise(ref)               : retourne une entreprise (slug = public, id = owner)
// - updateEntreprise(ref, updates)   : met à jour une entreprise (owner uniquement)
//
// ⚠️ Remarques :
// - La lecture publique se fait via le slug (string).
// - La lecture/modification propriétaire se fait via l’id ou le slug.
// - Les contrôles d’accès sont appliqués côté API.
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
// Services Entreprises
// ----------------------

/**
 * 📜 Liste publique de toutes les entreprises
 */
export async function listEntreprises(): Promise<{
  entreprises: Entreprise[];
}> {
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
 * 🔍 Récupérer une entreprise
 * @param ref - slug (string) → lecture publique | id (number) → lecture owner
 */
export async function getEntreprise(
  ref: string | number
): Promise<{ data: Entreprise }> {
  return request<{ data: Entreprise }>(`/api/entreprises/${ref}`);
}

/**
 * ✏️ Mettre à jour une entreprise (owner uniquement)
 * @param ref - identifiant numérique OU slug de l’entreprise
 */
export async function updateEntreprise(
  ref: string | number,
  updates: Partial<
    Omit<Entreprise, "id" | "slug" | "created_at" | "updated_at">
  >
): Promise<{ data: Entreprise }> {
  return request<{ data: Entreprise }>(`/api/entreprises/${ref}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}
