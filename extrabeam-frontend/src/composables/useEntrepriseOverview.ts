// src/composables/useEntrepriseOverview.ts
// -------------------------------------------------------------
// Composable pour charger l'overview d'une entreprise
// -------------------------------------------------------------
import { ref } from "vue";
import { getEntrepriseOverview } from "../services/entreprises";

export function useEntrepriseOverview(slug: string) {
  const overview = ref<any>(null);
  const loading = ref(false);

  async function load(forceAuth = true) {
    loading.value = true;
    overview.value = await getEntrepriseOverview(slug, { forceAuth });
    loading.value = false;
  }

  return { overview, loading, load };
}
