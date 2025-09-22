// src/services/auth.ts
import { supabase } from "./supabase"; // 👈 on réutilise l’instance existante

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
export async function register(payload: {
  email: string;
  password: string;
  role: "freelance" | "client";
  entreprise?: { nom: string; prenom: string };
}) {
  // ⚠️ Pour l’instant tu appelles encore ton ancienne API
  // Quand tu migreras, tu utiliseras directement supabase.auth.signUp()
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Erreur inscription");
  return res.json();
}

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data.session; // contient access_token
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
