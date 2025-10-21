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
 *
 * - `ref` peut être le slug (ex: "adam-achbarou") ou l'id numérique
 * - Si ref est absent → erreur claire côté frontend
 * - Si forceAuth=true → inclut le token dans la requête (même pour slug)
 */
export async function getEntreprise(
  ref: string | number | undefined,
  opts: { forceAuth?: boolean } = {}
): Promise<{ entreprise: Entreprise }> {
  if (!ref) {
    console.warn("⚠️ getEntreprise appelé sans ref → requête annulée");
    throw new Error("Slug ou ID manquant pour getEntreprise()");
  }

  const isPublicSlug = typeof ref === "string" && !opts.forceAuth;
  console.log(
    `🔍 getEntreprise(${ref}) → ${isPublicSlug ? "public" : "authentifié"}`
  );

  return request<{ entreprise: Entreprise }>(`/api/entreprises/${ref}`, {
    skipAuth: isPublicSlug,
  });
}

/**
 * 🌐 Vue globale d'une entreprise (publique ou propriétaire)
 *
 * Retourne :
 * - Si owner/admin → missions, factures, slots, unavailabilities
 * - Si visiteur → slots publics, unavailabilities, infos publiques
 */
export async function getEntrepriseOverview(
  ref: string,
  opts: { forceAuth?: boolean } = {}
): Promise<{
  mode: "owner" | "public";
  entreprise: any;
  missions?: any[];
  factures?: any[];
  slots: any[];
  unavailabilities: any[];
}> {
  const isPublic = !opts.forceAuth;
  return request(
    `/api/entreprises/${ref}/overview`,
    { skipAuth: isPublic }
  );
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
  if (!ref) throw new Error("ID entreprise manquant pour connectStripe()");
  return request<{ url: string }>(`/api/entreprises/${ref}/connect-stripe`);
}
