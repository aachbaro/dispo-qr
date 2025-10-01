// src/services/api.ts
// -------------------------------------------------------------
// Service utilitaire pour les appels API HTTP
// -------------------------------------------------------------
//
// 📌 Description :
//   - Centralise les appels HTTP vers les endpoints de l’application
//   - Gère automatiquement :
//     • Ajout du token JWT dans les headers (si présent)
//     • Parsing JSON + gestion d’erreurs enrichies
//     • Logs conditionnels en dev
//
// 📍 Fonctions :
//   - getAuthHeaders() : construit les headers d’authentification
//   - request<T>(url, options) : wrapper générique autour de fetch()
//
// 🔒 Règles d’accès :
//   - Le token est récupéré depuis localStorage (clé: "authToken")
//   - `skipAuth: true` permet d’appeler un endpoint public sans Authorization
//
// ⚠️ Remarques :
//   - Ce service est utilisé par tous les autres (entreprises, missions, factures, slots…)
//   - Bonne pratique : centraliser la logique API pour éviter la duplication
// -------------------------------------------------------------

// ----------------------
// Custom Error
// ----------------------

/**
 * Erreur enrichie pour les appels API.
 * Contient le code HTTP + le body de la réponse.
 */
export class ApiError extends Error {
  status: number;
  body: any;

  constructor(status: number, body: any, message?: string) {
    super(message || body?.error || "API Error");
    this.status = status;
    this.body = body;
  }
}

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

// ----------------------
// Core Request
// ----------------------

/**
 * Wrapper générique autour de fetch() pour simplifier les appels API.
 *
 * @param url - l’URL de l’endpoint API
 * @param options - les options de la requête (méthode, headers, body, skipAuth…)
 * @returns La réponse parsée en JSON
 *
 * @example
 * const { entreprises } = await request<{ entreprises: Entreprise[] }>("/api/entreprises")
 */
export async function request<T>(
  url: string,
  options: RequestInit & { skipAuth?: boolean } = {}
): Promise<T> {
  const headers = {
    "Content-Type": "application/json",
    ...(options.skipAuth ? {} : getAuthHeaders()),
    ...(options.headers || {}),
  };

  if (import.meta.env.VITE_DEBUG_API) {
    console.log("🌍 Fetch:", url, options.method || "GET", { headers });
  }

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    console.error("❌ API error:", res.status, body);
    throw new ApiError(res.status, body);
  }

  return res.json();
}
