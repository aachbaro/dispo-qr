// src/composables/useAdmin.ts
import { ref } from "vue";

const isAdmin = ref<boolean>(false);

// init depuis localStorage + synchro inter-onglets
if (typeof window !== "undefined") {
  isAdmin.value = !!localStorage.getItem("adminToken");
  window.addEventListener("storage", (e) => {
    if (e.key === "adminToken") {
      isAdmin.value = !!localStorage.getItem("adminToken");
    }
  });
}

function setAdmin(val: boolean) {
  isAdmin.value = val;
  if (!val && typeof window !== "undefined") {
    // logout → supprimer le token
    localStorage.removeItem("adminToken");
  }
}

export default function useAdmin() {
  return { isAdmin, setAdmin };
}

export { isAdmin, setAdmin };
