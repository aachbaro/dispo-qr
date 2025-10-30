<!-- src/components/ConnectStripeButton.vue -->
<!-- -------------------------------------------------------------
     Bouton connexion Stripe
------------------------------------------------------------- -->

<template>
  <div>
    <button
      @click="connectStripe(refEntreprise)"
      class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
      :disabled="loading"
    >
      <span v-if="!loading">🔗 Connecter mon compte Stripe</span>
      <span v-else>⏳ Connexion en cours...</span>
    </button>

    <p v-if="error" class="text-red-600 mt-2">
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { useStripe } from "../composables/useStripe";

const props = defineProps<{
  refEntreprise: string | number;
}>();

const { connectStripe, loading, error } = useStripe();
</script>
