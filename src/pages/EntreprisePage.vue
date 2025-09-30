<!-- src/pages/EntreprisePage.vue -->
<!-- -------------------------------------------------------------
 Page de détail d’une entreprise
 ---------------------------------------------------------------
 Affiche :
 - Infos de l’entreprise (nom, prénom, infos publiques ou privées)
 - Agenda (slots)
 - Missions (selon droits)
 - Factures (owner uniquement)
 
 ⚠️ Règles :
 - Si l’utilisateur connecté est owner (slug correspond) → accès complet
 - Sinon → accès en lecture publique
 ------------------------------------------------------------- -->

<template>
  <div class="w-full flex flex-col items-center justify-center px-4 mx-4 pb-5">
    <!-- Header infos entreprise -->
    <div class="max-w-[1200px] w-full mb-6">
      <h1 class="text-2xl font-bold">
        {{ entreprise?.nom }} {{ entreprise?.prenom }}
      </h1>
      <p class="text-gray-600">Agenda et missions de l’entreprise</p>

      <div v-if="loading" class="text-gray-500 mt-2">Chargement...</div>
      <div v-else-if="!entreprise" class="text-red-600 mt-2">
        ❌ Entreprise introuvable
      </div>

      <!-- Infos entreprise -->
      <EntrepriseInfos
        v-else
        :entreprise="entreprise"
        :is-owner="isOwner"
        @updated="entreprise = $event"
      />
    </div>

    <!-- Agenda -->
    <div
      class="h-[70vh] max-w-[1200px] w-full flex items-center border border-black p-3 rounded-lg"
    >
      <Agenda
        v-if="entreprise"
        :ref-id="entreprise.id"
        :slug="entreprise.slug"
        :is-admin="isOwner"
      />
    </div>

    <!-- Missions -->
    <div class="max-w-[1200px] w-full mt-4 border border-black p-3 rounded-lg">
      <MissionList
        v-if="entreprise"
        :ref-id="entreprise.id"
        :slug="entreprise.slug"
        :is-owner="isOwner"
      />
    </div>

    <!-- Factures -->
    <div
      v-if="entreprise && isOwner"
      class="max-w-[1200px] w-full mt-4 border border-black p-3 rounded-lg"
    >
      <FactureList
        :ref-entreprise="entreprise.id"
        :entreprise="entreprise"
        @edit="onEditFacture"
        @deleted="onDeletedFacture"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import { useAuth } from "../composables/useAuth";
import { getEntreprise } from "../services/entreprises";

import Agenda from "../components/agenda/Agenda.vue";
import MissionList from "../components/missions/MissionList.vue";
import EntrepriseInfos from "../components/EntrepriseInfos.vue";
import FactureList from "../components/factures/FactureList.vue";

// ----------------------
// State
// ----------------------
const route = useRoute();
const entreprise = ref<any>(null);
const loading = ref(true);

// 👤 Utilisateur connecté
const { user } = useAuth();

// 👇 Vérifie si le user connecté est propriétaire
const isOwner = computed(() => user.value?.slug === route.params.slug);

// ----------------------
// Lifecycle
// ----------------------
onMounted(async () => {
  try {
    const { entreprise: e } = await getEntreprise(route.params.slug as string);
    entreprise.value = e;
  } catch (err) {
    console.error("❌ Erreur chargement entreprise :", err);
  } finally {
    loading.value = false;
  }
});

// ----------------------
// Handlers factures
// ----------------------
function onEditFacture(facture: any) {
  console.log("✏️ Éditer facture", facture);
  // TODO: ouvrir modal édition facture
}

function onDeletedFacture(id: number) {
  console.log("🗑️ Facture supprimée", id);
}
</script>
