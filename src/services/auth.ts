// src/services/auth.ts
import { createClient } from "@supabase/supabase-js";

// ----------------------
// Supabase client (frontend)
// ----------------------
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string
);

// ----------------------
// Types
// ----------------------
export type UserRole = "freelance" | "client" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  role?: UserRole;
  slug?: string; // 👈 si freelance avec entreprise
  nom?: string;
  prenom?: string;
}

// ----------------------
// Helpers
// ----------------------
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error("❌ Erreur getUser:", error.message);
    return null;
  }
  if (!data.user) return null;

  // 👇 Custom claims si tu veux stocker plus (role, slug…)
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
// Auth actions
// ----------------------

/**
 * Inscription avec Supabase Auth
 */
export async function register(
  email: string,
  password: string,
  metadata?: any
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata, // 👈 user_metadata (role, nom, prenom…)
    },
  });

  if (error) throw error;

  return data.user;
}

/**
 * Connexion avec Supabase Auth
 */
export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  return data.session; // contient access_token
}

/**
 * Déconnexion
 */
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
