<!-- src/components/factures/FactureCard.vue -->
<template>
  <div
    class="border rounded-lg p-4 shadow-sm bg-white flex justify-between items-center"
  >
    <!-- Infos facture -->
    <div>
      <h3 class="font-semibold">📄 Facture {{ facture.numero }}</h3>
      <p class="text-sm text-gray-600">
        Émise le {{ formatDate(facture.date_emission) }}
      </p>

      <!-- Client -->
      <p class="text-sm">Client : {{ facture.client_name }}</p>
      <div v-if="hasAddress" class="text-sm text-gray-700 ml-2">
        📍
        {{ facture.client_address_ligne1 }}
        <span v-if="facture.client_address_ligne2">
          , {{ facture.client_address_ligne2 }}
        </span>
        <br />
        {{ facture.client_code_postal || "" }} {{ facture.client_ville || "" }}
        <span v-if="facture.client_pays">({{ facture.client_pays }})</span>
      </div>

      <!-- Montant -->
      <p class="text-sm font-bold mt-1">
        Total TTC : {{ facture.montant_ttc.toFixed(2) }} €
      </p>
    </div>

    <!-- Actions -->
    <div class="flex gap-2">
      <button class="btn-secondary" @click="downloadPdf">⬇️ PDF</button>
      <button class="btn-secondary" @click="$emit('edit', facture)">
        ✏️ Modifier
      </button>
      <button class="btn-danger" @click="onDelete">🗑️ Supprimer</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Facture } from "../../services/factures";
import { useFactures } from "../../composables/useFactures";
import { generateFacturePdf } from "../../utils/pdf/facturePdf";

const props = defineProps<{
  facture: Facture;
  refEntreprise: string | number;
  entreprise: any; // ⚠️ doit contenir iban, bic, infos émetteur
}>();

const emit = defineEmits(["edit", "deleted"]);

const { removeFacture } = useFactures();

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("fr-FR");
}

const hasAddress = computed(
  () =>
    props.facture.client_address_ligne1 ||
    props.facture.client_address_ligne2 ||
    props.facture.client_code_postal ||
    props.facture.client_ville ||
    props.facture.client_pays
);

async function onDelete() {
  if (!confirm("Supprimer cette facture ?")) return;
  try {
    await removeFacture(props.refEntreprise, props.facture.id);
    emit("deleted", props.facture.id);
  } catch (err) {
    alert("❌ Erreur lors de la suppression de la facture");
    console.error(err);
  }
}

function downloadPdf() {
  try {
    generateFacturePdf(props.facture, props.entreprise);
  } catch (err) {
    console.error("❌ Erreur génération PDF:", err);
    alert("Impossible de générer le PDF.");
  }
}
</script>

<style scoped>
.btn-secondary {
  @apply px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm;
}
.btn-danger {
  @apply px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-white text-sm;
}
</style>
