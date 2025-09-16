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
  if (typeof window !== "undefined") {
    if (val) localStorage.setItem("adminToken", "1");
    else localStorage.removeItem("adminToken");
  }
}

export default function useAdmin() {
  return { isAdmin, setAdmin };
}

// (optionnel) exports nommés si tu en as besoin ailleurs
export { isAdmin, setAdmin };
