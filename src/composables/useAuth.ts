// src/composables/useAuth.ts
// -------------------------------------------------------------
// Composable global d’authentification
//
// - Stocke user + token en réactif et dans localStorage
// - Permet setUser / clearAuth
// - Récupère automatiquement la session Supabase au démarrage
// -------------------------------------------------------------

import { ref, onMounted } from "vue";
import type { AuthUser } from "../services/auth";
import { getSession, getCurrentUser } from "../services/auth";

// ----------------------
// State global
// ----------------------
const storedUser = localStorage.getItem("authUser");
const storedToken = localStorage.getItem("authToken");

const user = ref<AuthUser | null>(storedUser ? JSON.parse(storedUser) : null);
const token = ref<string | null>(storedToken ?? null);

// ----------------------
// Composable
// ----------------------
export function useAuth() {
  /**
   * ✅ Met à jour user + token
   */
  function setUser(newUser: AuthUser | null, newToken?: string) {
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
   * 🚪 Déconnexion locale
   */
  function clearAuth() {
    user.value = null;
    token.value = null;
    localStorage.removeItem("authUser");
    localStorage.removeItem("authToken");
  }

  /**
   * 🔄 Initialise depuis Supabase (au montage)
   */
  async function initAuth() {
    const session = await getSession();
    if (session?.access_token) {
      token.value = session.access_token;
      localStorage.setItem("authToken", session.access_token);

      const currentUser = await getCurrentUser();
      if (currentUser) {
        user.value = currentUser;
        localStorage.setItem("authUser", JSON.stringify(currentUser));
      }
    }
  }

  // Exécuter au démarrage (1 seule fois)
  onMounted(initAuth);

  return { user, token, setUser, clearAuth, initAuth };
}
