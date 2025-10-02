<!-- src/components/factures/FactureList.vue -->
<!-- -------------------------------------------------------------
 Liste des factures (FactureList)
 ---------------------------------------------------------------
 📌 Description :
 - Affiche une liste de FactureCard
 - Mode entreprise : édition, suppression, génération lien
 - Mode client (readonly) : lecture seule, téléchargement PDF, lien paiement

 🔒 Règles d’accès :
 - Entreprise/admin : accès complet
 - Client (readonly) : lecture seule
 ------------------------------------------------------------- -->

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
        :entreprise="entreprise"
        :readonly="readonly"
        @edit="onEdit"
        @deleted="onDeleted"
        @updated="onUpdated"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useFactures } from "../../composables/useFactures";
import FactureCard from "./FactureCard.vue";

const props = defineProps<{
  entreprise?: any; // ⚠️ doit contenir infos de l’entreprise (iban, bic…)
  readonly?: boolean; // 👈 nouveau mode lecture seule
}>();

const emit = defineEmits(["edit", "deleted", "updated"]);

const { factures, loading, fetchFactures } = useFactures();

// Charger au montage
onMounted(() => {
  fetchFactures();
});

function onEdit(facture: any) {
  emit("edit", facture);
}

function onDeleted(id: number) {
  emit("deleted", id);
}

function onUpdated(facture: any) {
  emit("updated", facture);
}
</script>
