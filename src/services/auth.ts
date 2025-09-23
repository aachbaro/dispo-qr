// src/services/auth.ts
// -------------------------------------------------------------
// Services liés à l’authentification (couche Supabase)
//
// Fonctions disponibles :
// - getSession()              : retourne la session en cours (JWT, user, etc.)
// - getCurrentUser()          : retourne les infos du user courant (AuthUser)
// - register(payload)         : inscription via l’API backend (/api/auth/register)
// - login(email, password)    : connexion via Supabase Auth (retourne session)
// - logout()                  : déconnexion Supabase
//
// ⚠️ Remarques :
// - Le stockage user/token est désormais géré par `useAuth.ts`.
// - Ici : uniquement les appels Supabase / API.
// -------------------------------------------------------------

import { supabase } from "./supabase";

// ----------------------
// Types
// ----------------------
export type UserRole = "freelance" | "client" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  role?: UserRole;
  slug?: string; // slug entreprise si freelance
  nom?: string;
  prenom?: string;
}

// ----------------------
// Helpers
// ----------------------

/**
 * 🔑 Récupérer la session en cours (token, infos user, expiration…)
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

/**
 * 👤 Récupérer l’utilisateur courant (ou null si non connecté)
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error("❌ Erreur getUser:", error.message);
    return null;
  }
  if (!data.user) return null;

  const metadata = data.user.user_metadata;

  return {
    id: data.user.id,
    email: data.user.email!,
    role: metadata?.role,
    slug: metadata?.slug,
    nom: metadata?.nom,
    prenom: metadata?.prenom,
  };
}

// ----------------------
// Actions
// ----------------------

/**
 * 📝 Inscription (via backend custom)
 */
export async function register(payload: {
  email: string;
  password: string;
  role: "freelance" | "client";
  entreprise?: { nom: string; prenom: string };
}) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Erreur inscription");
  return res.json();
}

/**
 * 🔑 Connexion utilisateur
 */
export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  const session = data.session;
  const token = session?.access_token;

  if (token) {
    console.log("🔑 Token sauvegardé:", token);
    localStorage.setItem("authToken", token);
  } else {
    console.warn("⚠️ Aucun access_token reçu de Supabase !");
  }

  return session;
}

/**
 * 🚪 Déconnexion utilisateur
 */
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
