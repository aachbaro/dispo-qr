<!-- src/components/factures/FactureList.vue -->
<template>
  <div class="space-y-4 mt-8">
    <!-- Titre -->
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-bold text-gray-800">📑 Factures</h2>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-gray-500 italic">
      Chargement des factures...
    </div>

    <!-- Vide -->
    <div v-else-if="factures.length === 0" class="text-gray-500 italic">
      Aucune facture pour le moment.
    </div>

    <!-- Liste -->
    <div v-else class="grid gap-3">
      <FactureCard
        v-for="f in factures"
        :key="f.id"
        :facture="f"
        :ref-entreprise="refEntreprise"
        :entreprise="entreprise"
        @edit="onEdit"
        @deleted="onDeleted"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from "vue";
import { useFactures } from "../../composables/useFactures";
import FactureCard from "./FactureCard.vue";

const props = defineProps<{
  refEntreprise: string | number;
  entreprise: any; // ⚠️ doit contenir infos de l’entreprise (iban, bic…)
}>();

const emit = defineEmits(["edit", "deleted"]);

const { factures, loading, fetchFactures } = useFactures();

// Charger au montage
onMounted(() => {
  fetchFactures(props.refEntreprise);
});

// Recharger si refEntreprise change
watch(
  () => props.refEntreprise,
  (newRef) => {
    if (newRef) fetchFactures(newRef);
  }
);

function onEdit(facture: any) {
  emit("edit", facture);
}

function onDeleted(id: number) {
  emit("deleted", id);
}
</script>
