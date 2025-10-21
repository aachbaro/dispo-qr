// src/composables/useAuth.ts
// -------------------------------------------------------------
// Composable global d’authentification
// -------------------------------------------------------------
//
// 📌 Description :
//   - Gère l’état utilisateur (user + token) en réactif
//   - Persiste dans localStorage ("authUser", "authToken")
//   - Fournit les actions : setUser, initAuth, logout, loginGoogle, loginMagicLink
//   - Restaure la session Supabase au démarrage
//
// 🔒 Règles d’accès :
//   - AuthUser contient id, email, role, slug (si freelance),
//     ainsi que first_name, last_name, phone.
//   - Les vérifications de droits se font côté API uniquement.
//
// ⚠️ Remarques :
//   - initAuth() doit être appelée une fois (dans App.vue ou Layout principal)
//   - Toutes les modifications mettent à jour localStorage automatiquement
//   - Ajout d’un état `isReady` et d’une promesse `ready()`
//     permettant au frontend d’attendre que l’auth soit initialisée
// -------------------------------------------------------------

import { ref } from "vue";
import type { AuthUser } from "@/services/auth";
import {
  getSession,
  getCurrentUser,
  logout as logoutService,
  signInWithGoogle,
  signInWithMagicLink,
} from "@/services/auth";
import { request } from "@/services/api";

// ----------------------
// State global
// ----------------------
const storedUser = localStorage.getItem("authUser");
const storedToken = localStorage.getItem("authToken");

const user = ref<AuthUser | null>(storedUser ? JSON.parse(storedUser) : null);
const token = ref<string | null>(storedToken ?? null);
const loading = ref<boolean>(true);

// Nouveau : indique si l’auth a terminé son initialisation
const isReady = ref<boolean>(false);
let readyPromise: Promise<void> | null = null;
let resolveReady: (() => void) | null = null;

// ----------------------
// Composable principal
// ----------------------
export function useAuth() {
  /**
   * ✅ Met à jour l’utilisateur et le token localement
   */
  function setUser(newUser: AuthUser | null, newToken?: string | null) {
    user.value = newUser;
    token.value = newToken ?? token.value;

    if (newUser) {
      localStorage.setItem("authUser", JSON.stringify(newUser));
      if (newToken ?? token.value) {
        localStorage.setItem("authToken", newToken ?? token.value!);
      }
    } else {
      localStorage.removeItem("authUser");
      localStorage.removeItem("authToken");
    }
  }

  /**
   * 🚪 Déconnexion complète (Supabase + localStorage)
   */
  async function logout() {
    try {
      await logoutService();
    } catch (e) {
      console.warn("⚠️ Erreur logout Supabase (non bloquante):", e);
    } finally {
      clearAuth();
    }
  }

  /**
   * 🧹 Réinitialisation locale du state
   */
  function clearAuth() {
    user.value = null;
    token.value = null;
    localStorage.removeItem("authUser");
    localStorage.removeItem("authToken");
  }

  /**
   * 🔄 Initialisation depuis Supabase (session persistée)
   */
  async function initAuth() {
    loading.value = true;
    readyPromise = new Promise<void>((resolve) => (resolveReady = resolve));

    try {
      const session = await getSession();

      if (session?.access_token) {
        token.value = session.access_token;
        localStorage.setItem("authToken", session.access_token);

        // 👤 Charge le profil complet via backend
        const { profile } = await request<{ profile: AuthUser }>(
          "/api/profiles/me"
        );

        if (profile) {
          user.value = profile;
          localStorage.setItem("authUser", JSON.stringify(profile));
        } else {
          console.warn("⚠️ Aucun profil retourné par /api/profiles/me");
          clearAuth();
        }
      } else {
        clearAuth();
      }
    } catch (e) {
      console.error("❌ Erreur initAuth :", e);
      clearAuth();
    } finally {
      loading.value = false;
      isReady.value = true;
      resolveReady?.(); // 🔓 Débloque la promesse ready()
    }
  }

  /**
   * 🕓 Attente que l’auth soit prête (promesse)
   */
  async function ready() {
    if (isReady.value) return;
    if (!readyPromise) {
      readyPromise = new Promise<void>((resolve) => (resolveReady = resolve));
    }
    await readyPromise;
  }

  /**
   * 🔐 Connexion via Google OAuth
   */
  async function loginGoogle() {
    try {
      await signInWithGoogle();
    } catch (e) {
      console.error("❌ Erreur login Google :", e);
    }
  }

  /**
   * ✉️ Connexion / inscription via Magic Link
   */
  async function loginMagicLink(email: string, metadata?: Record<string, any>) {
    try {
      await signInWithMagicLink(email, metadata);
      alert(`Un lien de connexion a été envoyé à ${email}`);
    } catch (e) {
      console.error("❌ Erreur Magic Link :", e);
      throw e;
    }
  }

  // ----------------------
  // Expose API du composable
  // ----------------------
  return {
    user,
    token,
    loading,
    isReady,
    ready, // 👈 permet d’attendre initAuth()
    setUser,
    clearAuth,
    logout,
    initAuth,
    loginGoogle,
    loginMagicLink,
  };
}
