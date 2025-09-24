// src/services/api.ts
// -------------------------------------------------------------
// Service utilitaire pour les appels API HTTP
//
// Fonctions disponibles :
//
// - getAuthHeaders() : construit les headers avec le token s’il existe
// - request<T>(url, options) : wrapper générique autour de fetch()
//    → ajoute automatiquement les headers communs
//    → logge les appels
//    → gère les erreurs et parse la réponse JSON
//
// ⚠️ Remarques :
// - Le token est récupéré depuis localStorage (clé: "authToken").
// - Ce service est utilisé par tous les autres (entreprises, missions, slots…).
// - Bonne pratique : centraliser la logique API pour éviter la duplication.
// -------------------------------------------------------------

// ----------------------
// Helpers
// ----------------------

/**
 * Construit les headers d’authentification pour les requêtes API.
 * Récupère le token stocké dans localStorage et l’ajoute en tant que Bearer.
 */
export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Wrapper générique autour de fetch() pour simplifier les appels API.
 *
 * @param url - l’URL de l’endpoint API
 * @param options - les options de la requête (méthode, headers, body…)
 * @returns La réponse parsée en JSON
 *
 * @example
 * const { entreprises } = await request<{ entreprises: Entreprise[] }>("/api/entreprises");
 */
export async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  // console.log("🌍 Fetch:", url, options.method || "GET", { headers });

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("❌ API error:", res.status, err);
    throw new Error(err.error || res.statusText);
  }

  return res.json();
}
