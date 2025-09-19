// src/services/supabaseClient.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "❌ Supabase URL ou Anon Key manquants dans les variables d'environnement"
  );
}

// ----------------------
// Client principal
// ----------------------
export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true, // rafraîchit automatiquement les tokens expirés
      persistSession: true, // stocke la session en localStorage
      detectSessionInUrl: true, // nécessaire pour login via magic link / OAuth
    },
  }
);

// ----------------------
// Helpers
// ----------------------
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error("❌ Erreur récupération utilisateur:", error.message);
    return null;
  }
  return data.user ?? null;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("❌ Erreur récupération session:", error.message);
    return null;
  }
  return data.session ?? null;
}
