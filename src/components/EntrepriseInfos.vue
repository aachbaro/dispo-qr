<template>
  <div class="p-4 border border-black rounded bg-white mt-4">
    <!-- Infos -->
    <p><b>Email :</b> {{ entreprise.email }}</p>
    <p><b>Téléphone :</b> {{ entreprise.telephone || "—" }}</p>
    <p><b>Adresse :</b> {{ entreprise.adresse || "—" }}</p>

    <!-- Bouton Modifier (visible seulement pour le propriétaire) -->
    <div v-if="isOwner" class="mt-4 flex justify-end">
      <button
        class="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
        @click="showEdit = true"
      >
        Modifier
      </button>
    </div>

    <!-- Popup édition -->
    <EntrepriseEditPopup
      v-if="showEdit"
      :open="showEdit"
      :entreprise="entreprise"
      @close="showEdit = false"
      @updated="onUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { Entreprise } from "../services/entreprises";
import EntrepriseEditPopup from "./EntrepriseEditPopup.vue";

const props = defineProps<{
  entreprise: Entreprise;
  isOwner: boolean;
}>();

const emit = defineEmits<{
  (e: "updated", data: Entreprise): void;
}>();

const showEdit = ref(false);

function onUpdated(data: Entreprise) {
  emit("updated", data); // 👈 remonte l’info au parent
}
</script>
