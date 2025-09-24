// src/composables/useStripe.ts
// -------------------------------------------------------------
// Composable Stripe
// -------------------------------------------------------------
//
// 📌 Description :
//   - Fournit les fonctions liées à Stripe côté frontend
//   - Utilise les services entreprises pour générer les liens
//   - Gère loading + erreurs réactifs
//
// ⚠️ Remarques :
//   - Pas besoin de service/stripe.ts séparé, tout reste dans entreprises.ts
// -------------------------------------------------------------

import { ref } from "vue";
import { connectEntrepriseStripe } from "../services/entreprises";

export function useStripe() {
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * 🔗 Connecter l’entreprise à Stripe (redirection onboarding)
   * @param refEntreprise - slug ou id de l’entreprise
   */
  async function connectStripe(refEntreprise: string | number) {
    try {
      loading.value = true;
      error.value = null;

      const { url } = await connectEntrepriseStripe(refEntreprise);

      // Redirection vers Stripe
      window.location.href = url;
    } catch (err: any) {
      console.error("❌ useStripe connect error:", err);
      error.value = err.message || "Erreur de connexion à Stripe";
    } finally {
      loading.value = false;
    }
  }

  return {
    loading,
    error,
    connectStripe,
  };
}
