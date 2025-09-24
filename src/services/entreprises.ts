// src/services/entreprises.ts
// -------------------------------------------------------------
// Services liés aux entreprises
//
// Fonctions disponibles :
// - listEntreprises()                : retourne la liste publique de toutes les entreprises
// - createEntreprise(payload)        : crée une entreprise (user connecté requis)
// - getEntreprise(ref)               : retourne une entreprise (slug = public, id = owner)
// - updateEntreprise(ref, updates)   : met à jour une entreprise (owner uniquement)
// - connectEntrepriseStripe(ref)     : génère un lien d’onboarding Stripe
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

  // ✅ Adresse découpée
  adresse_ligne1: string;
  adresse_ligne2?: string;
  ville: string;
  code_postal: string;
  pays: string;

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

  // Ajout Stripe
  stripe_account_id?: string;
}

// ----------------------
// Services Entreprises
// ----------------------

export async function listEntreprises(): Promise<{
  entreprises: Entreprise[];
}> {
  return request<{ entreprises: Entreprise[] }>("/api/entreprises");
}

export async function createEntreprise(
  payload: Omit<Entreprise, "id" | "created_at" | "updated_at" | "user_id">
): Promise<{ entreprise: Entreprise }> {
  return request<{ entreprise: Entreprise }>("/api/entreprises", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getEntreprise(
  ref: string | number
): Promise<{ entreprise: Entreprise }> {
  return request<{ entreprise: Entreprise }>(`/api/entreprises/${ref}`);
}

export async function updateEntreprise(
  ref: string | number,
  updates: Partial<
    Omit<Entreprise, "id" | "slug" | "created_at" | "updated_at">
  >
): Promise<{ entreprise: Entreprise }> {
  return request<{ entreprise: Entreprise }>(`/api/entreprises/${ref}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

/**
 * 🔗 Connecter une entreprise à Stripe (génère un lien d’onboarding)
 * @param ref - slug ou id de l’entreprise
 * @returns URL Stripe à laquelle rediriger l’utilisateur
 */
export async function connectEntrepriseStripe(
  ref: string | number
): Promise<{ url: string }> {
  return request<{ url: string }>(`/api/entreprises/${ref}/connect-stripe`);
}
