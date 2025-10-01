// src/composables/useAdmin.ts
// -------------------------------------------------------------
// Composable de gestion du mode admin
// -------------------------------------------------------------
//
// 📌 Description :
//   - Expose un état réactif `isAdmin` basé sur la présence d’un token
//   - Permet d’activer/désactiver le mode admin avec `setAdmin`
//   - Synchro automatique entre onglets via `storage`
//
// 🔒 Règles d’accès :
//   - Admin = présence d’un "adminToken" dans localStorage
//   - Ce composable ne gère pas la validation réelle du token (fait côté API)
//
// ⚠️ Remarques :
//   - Si `setAdmin(false)` → suppression du token (logout admin)
//   - À utiliser dans les vues protégées pour vérifier l’accès
//
// -------------------------------------------------------------

import { ref } from "vue";

// ----------------------
// State global
// ----------------------

const isAdmin = ref<boolean>(false);

// Init depuis localStorage + synchro inter-onglets
if (typeof window !== "undefined") {
  isAdmin.value = !!localStorage.getItem("adminToken");

  window.addEventListener("storage", (e) => {
    if (e.key === "adminToken") {
      isAdmin.value = !!localStorage.getItem("adminToken");
    }
  });
}

// ----------------------
// Actions
// ----------------------

/**
 * ✅ Définit le statut admin
 * @param val - true pour activer, false pour désactiver
 */
function setAdmin(val: boolean) {
  isAdmin.value = val;

  if (!val && typeof window !== "undefined") {
    // logout → suppression du token
    localStorage.removeItem("adminToken");
  }
}

// ----------------------
// Export composable
// ----------------------

export default function useAdmin() {
  return { isAdmin, setAdmin };
}

export { isAdmin, setAdmin };
