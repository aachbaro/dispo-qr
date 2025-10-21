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
 - Côté frontend → toujours passer le slug
 - Côté backend → décide si infos sensibles (owner/admin) ou publiques
--------------------------------------------------------------- -->

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

      <!-- Bouton ajouter en contact (si client et pas owner) -->
      <div
        v-if="user?.role === 'client' && !isOwner && entreprise"
        class="mt-4"
      >
        <AddContactButton :entreprise-id="entreprise.id" />
      </div>
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
      <MissionList v-if="entreprise" :is-owner="isOwner" />
    </div>

    <!-- Factures -->
    <div
      v-if="entreprise && isOwner"
      class="max-w-[1200px] w-full mt-4 border border-black p-3 rounded-lg"
    >
      <FactureList
        :entreprise="entreprise"
        @edit="onEditFacture"
        @deleted="onDeletedFacture"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { useRoute } from "vue-router";
import { useAuth } from "../composables/useAuth";
import { getEntreprise } from "../services/entreprises";

import Agenda from "../components/agenda/Agenda.vue";
import MissionList from "../components/missions/MissionList.vue";
import EntrepriseInfos from "../components/EntrepriseInfos.vue";
import FactureList from "../components/factures/FactureList.vue";
import AddContactButton from "../components/AddContactButton.vue";

const route = useRoute();
const entreprise = ref<any>(null);
const loading = ref(true);

const { user, ready } = useAuth(); // 👈 attend que useAuth soit prêt

// 👇 Vérifie si le user connecté est propriétaire (même slug)
const isOwner = computed(() => user.value?.slug === route.params.slug);

// ----------------------
// Fonction principale de fetch
// ----------------------
async function fetchEntrepriseData(slug: string) {
  if (!slug) {
    console.warn("⚠️ Slug manquant, requête annulée");
    return;
  }

  try {
    loading.value = true;
    console.log("🔍 Chargement entreprise pour slug :", slug);
    console.log("👤 User connecté :", user.value);
    console.log("🔑 isOwner :", isOwner.value);

    let e;
    if (isOwner.value) {
      // 🔑 Owner → accès complet
      ({ entreprise: e } = await getEntreprise(slug, { forceAuth: true }));
    } else {
      // 👤 Accès public
      ({ entreprise: e } = await getEntreprise(slug));
    }

    entreprise.value = e;
  } catch (err) {
    console.error("❌ Erreur chargement entreprise :", err);
  } finally {
    loading.value = false;
  }
}

// ----------------------
// Lifecycle
// ----------------------
onMounted(async () => {
  // ⏳ attend que l’auth soit prête
  await ready();

  const slug = route.params.slug as string | undefined;
  if (!slug) {
    console.warn("⚠️ Aucun slug dans l’URL → fetch annulé");
    return;
  }

  await fetchEntrepriseData(slug);

  // 🌀 Recharger si user ou slug changent (ex : après login ou navigation)
  watch([() => user.value, () => route.params.slug], ([u, newSlug]) => {
    if (u && newSlug) fetchEntrepriseData(newSlug as string);
  });
});

// ----------------------
// Handlers factures
// ----------------------
function onEditFacture(facture: any) {
  console.log("✏️ Éditer facture", facture);
}

function onDeletedFacture(id: number) {
  console.log("🗑️ Facture supprimée", id);
}
</script>
