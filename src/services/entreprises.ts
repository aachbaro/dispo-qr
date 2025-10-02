// src/services/entreprises.ts
// -------------------------------------------------------------
// Services liés aux entreprises
// -------------------------------------------------------------
//
// 📌 Description :
//   - Fournit les appels API pour gérer les entreprises (CRUD + Stripe)
//   - Typé directement avec les types générés depuis Supabase
//
// 📍 Fonctions :
//   - listEntreprises()                → liste publique de toutes les entreprises
//   - createEntreprise(payload)        → crée une entreprise (user connecté requis)
//   - getEntreprise(ref)               → retourne une entreprise (slug = public, id = owner)
//   - updateEntreprise(ref, updates)   → met à jour une entreprise (owner uniquement)
//   - connectEntrepriseStripe(ref)     → génère un lien d’onboarding Stripe
//
// 🔒 Règles d’accès :
//   - Lecture publique via le slug (skipAuth)
//   - Lecture/modification propriétaire via l’id ou le slug (auth requise)
//   - Les contrôles d’accès sont appliqués côté API
// -------------------------------------------------------------

import { request } from "./api";
import type { Tables, TablesInsert, TablesUpdate } from "../../types/database";

// ----------------------
// Types
// ----------------------

export type Entreprise = Tables<"entreprise">;
export type EntrepriseInsert = TablesInsert<"entreprise">;
export type EntrepriseUpdate = TablesUpdate<"entreprise">;

// ----------------------
// Services Entreprises
// ----------------------

/**
 * 📋 Liste publique des entreprises
 */
export async function listEntreprises(): Promise<{
  entreprises: Entreprise[];
}> {
  return request<{ entreprises: Entreprise[] }>("/api/entreprises", {
    skipAuth: true,
  });
}

/**
 * ➕ Créer une entreprise (user connecté)
 */
export async function createEntreprise(
  payload: EntrepriseInsert
): Promise<{ entreprise: Entreprise }> {
  return request<{ entreprise: Entreprise }>("/api/entreprises", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * 🔍 Récupérer une entreprise (slug public, id privé)
 */
export async function getEntreprise(
  ref: string | number,
  opts: { forceAuth?: boolean } = {}
): Promise<{ entreprise: Entreprise }> {
  return request<{ entreprise: Entreprise }>(`/api/entreprises/${ref}`, {
    skipAuth: !opts.forceAuth && typeof ref === "string",
  });
}

/**
 * ✏️ Mettre à jour une entreprise (owner uniquement)
 */
export async function updateEntreprise(
  ref: string | number,
  updates: EntrepriseUpdate
): Promise<{ entreprise: Entreprise }> {
  return request<{ entreprise: Entreprise }>(`/api/entreprises/${ref}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

/**
 * 🔗 Connecter une entreprise à Stripe (génère un lien d’onboarding)
 */
export async function connectEntrepriseStripe(
  ref: string | number
): Promise<{ url: string }> {
  return request<{ url: string }>(`/api/entreprises/${ref}/connect-stripe`);
}
