// src/composables/useAuth.ts
// -------------------------------------------------------------
// Composable global d’authentification
// -------------------------------------------------------------
//
// 📌 Description :
//   - Gère l’état utilisateur (user + token) en réactif
//   - Persiste dans localStorage (clé: "authUser", "authToken")
//   - Fournit les actions : setUser, clearAuth, initAuth
//   - Au démarrage, restaure la session depuis Supabase
//
// 🔒 Règles d’accès :
//   - AuthUser contient id, email, role (+ slug si freelance)
//   - Les vérifications de droits restent côté API
//
// ⚠️ Remarques :
//   - Toute modif d’état met à jour localStorage
//   - initAuth() doit être appelé une fois (hook global ou layout)
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
   * ✅ Met à jour user + token (et localStorage)
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
   * 🚪 Déconnexion locale (reset + suppression storage)
   */
  function clearAuth() {
    user.value = null;
    token.value = null;
    localStorage.removeItem("authUser");
    localStorage.removeItem("authToken");
  }

  /**
   * 🔄 Récupère la session Supabase et initialise user/token
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

  // Exécuter une fois au montage global
  onMounted(initAuth);

  return { user, token, setUser, clearAuth, initAuth };
}
