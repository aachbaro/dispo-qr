<!-- src/pages/FacturePage.vue -->
<template>
  <div class="max-w-2xl mx-auto p-4">
    <h1 class="text-xl font-bold mb-4">📄 Facture {{ facture?.numero }}</h1>

    <!-- Bandeaux état -->
    <div v-if="paid" class="p-3 mb-3 rounded bg-green-100 text-green-700">
      ✅ Paiement confirmé avec succès
    </div>
    <div v-else-if="canceled" class="p-3 mb-3 rounded bg-red-100 text-red-700">
      ❌ Paiement annulé
    </div>

    <!-- Infos facture -->
    <div v-if="facture" class="border rounded p-4 bg-white shadow space-y-2">
      <p><b>Client :</b> {{ facture.client_name }}</p>
      <p><b>Total TTC :</b> {{ facture.montant_ttc.toFixed(2) }} €</p>
      <p>
        <b>Status :</b>
        <span
          :class="statusClasses[facture.status]"
          class="px-2 py-1 rounded text-sm font-medium"
        >
          {{ statusLabels[facture.status] || facture.status }}
        </span>
      </p>
    </div>
    <div v-else class="text-gray-500">Chargement...</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { getEntrepriseFacture } from "../services/factures";

// ----------------------
// State
// ----------------------
const route = useRoute();
const facture = ref<any>(null);
const paid = ref(false);
const canceled = ref(false);

// ----------------------
// Labels & styles
// ----------------------
const statusLabels: Record<string, string> = {
  pending: "En attente",
  pending_payment: "Paiement en attente",
  paid: "Payée",
  cancelled: "Annulée",
};

const statusClasses: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700",
  pending_payment: "bg-yellow-100 text-yellow-700",
  paid: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

// ----------------------
// Lifecycle
// ----------------------
onMounted(async () => {
  // 🎯 check paramètres Stripe
  paid.value = route.query.paid === "1";
  canceled.value = route.query.canceled === "1";

  // 🎯 recharge la facture si on a un id
  const refEntreprise = route.params.ref as string;
  const factureId = Number(route.params.id);

  try {
    const { facture: data } = await getEntrepriseFacture(
      refEntreprise,
      factureId
    );
    facture.value = data;
  } catch (err) {
    console.error("❌ Erreur chargement facture:", err);
  }
});
</script>
