<!-- src/components/EntrepriseInfos.vue -->
<template>
  <div class="p-4 border border-black rounded bg-white mt-4">
    <!-- Infos principales -->
    <p><b>Email :</b> {{ entreprise.email }}</p>
    <p><b>Téléphone :</b> {{ entreprise.telephone || "—" }}</p>

    <!-- Adresse -->
    <div>
      <b>Adresse :</b>
      <template v-if="hasAdresse">
        <div class="ml-4">
          <p>{{ entreprise.adresse_ligne1 }}</p>
          <p v-if="entreprise.adresse_ligne2">
            {{ entreprise.adresse_ligne2 }}
          </p>
          <p>
            {{ entreprise.code_postal || "" }}
            {{ entreprise.ville || "" }}
          </p>
          <p v-if="entreprise.pays">{{ entreprise.pays }}</p>
        </div>
      </template>
      <span v-else>—</span>
    </div>

    <!-- Bouton Modifier -->
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
      @updated="handleUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import type { Entreprise } from "../services/entreprises";
import EntrepriseEditPopup from "./EntrepriseEditPopup.vue";

// ✅ Props
const props = defineProps<{
  entreprise: Entreprise;
  isOwner: boolean;
}>();

// ✅ Events
const emit = defineEmits<{
  (e: "updated", data: Entreprise): void;
}>();

// ✅ State
const showEdit = ref(false);

// ✅ Computed
const hasAdresse = computed(() =>
  Boolean(
    props.entreprise.adresse_ligne1 ||
      props.entreprise.adresse_ligne2 ||
      props.entreprise.code_postal ||
      props.entreprise.ville ||
      props.entreprise.pays
  )
);

// ✅ Methods
function handleUpdated(data: Entreprise) {
  emit("updated", data);
}
</script>
