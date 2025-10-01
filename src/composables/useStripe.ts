// src/composables/useStripe.ts
// -------------------------------------------------------------
// Composable Stripe
// -------------------------------------------------------------
//
// 📌 Description :
//   - Fournit les fonctions liées à Stripe côté frontend
//   - Utilise les services entreprises pour générer les liens
//   - Expose un état réactif : loading + error
//
// 🔒 Règles d’accès :
//   - Seul l’owner de l’entreprise peut initier une connexion Stripe
//
// ⚠️ Remarques :
//   - Pas besoin de service/stripe.ts séparé → tout reste centralisé dans entreprises.ts
//   - La redirection est faite directement côté navigateur
// -------------------------------------------------------------

import { ref } from "vue";
import { connectEntrepriseStripe } from "../services/entreprises";

// ----------------------
// Composable
// ----------------------
export function useStripe() {
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * 🔗 Connecter une entreprise à Stripe (onboarding)
   * @param refEntreprise - slug (string) ou id (number) de l’entreprise
   */
  async function connectStripe(refEntreprise: string | number) {
    loading.value = true;
    error.value = null;

    try {
      const { url } = await connectEntrepriseStripe(refEntreprise);

      // 🚀 Redirection vers Stripe
      window.location.href = url;
    } catch (err: any) {
      console.error("❌ [useStripe] Erreur connexion:", err);
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
