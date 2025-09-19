<!-- src/pages/EntreprisePage.vue -->
<template>
  <div class="w-full flex flex-col items-center justify-center px-4 mx-4 pb-5">
    <!-- Header infos entreprise -->
    <div class="max-w-[1200px] w-full mb-6">
      <h1 class="text-2xl font-bold">
        {{ entreprise?.nom }} {{ entreprise?.prenom }}
      </h1>
      <p class="text-back-600">Agenda et missions de l’entreprise</p>

      <div v-if="loading" class="text-back-500 mt-2">Chargement...</div>
      <div v-else-if="!entreprise" class="text-red-600 mt-2">
        Entreprise introuvable
      </div>

      <div v-else class="p-4 border border-black rounded bg-white mt-4">
        <p><b>Email :</b> {{ entreprise.email }}</p>
        <p><b>Téléphone :</b> {{ entreprise.telephone || "—" }}</p>
        <p><b>Adresse :</b> {{ entreprise.adresse || "—" }}</p>
      </div>
    </div>

    <!-- Agenda -->
    <div
      class="h-[70vh] max-w-[1200px] w-full flex items-center border border-black p-3 rounded-lg"
    >
    <!-- 👇 Ici on détermine si l’utilisateur connecté est l’admin -->
    <Agenda :slug="route.params.slug" :is-admin="isOwner" />
  </div>
  
  <!-- Missions -->
  <div class="max-w-[1200px] w-full mt-4 border border-black p-3 rounded-lg">
      <MissionList :slug="route.params.slug" :is-owner="isOwner" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import { getEntrepriseBySlug } from "../services/entreprises";
import { getUser } from "../services/auth"; // 👈 pour savoir qui est connecté
import Agenda from "../components/agenda/Agenda.vue";
import MissionList from "../components/MissionList.vue";

const route = useRoute();
const entreprise = ref<any>(null);
const loading = ref(true);

const authUser = getUser(); // { id, email, role, slug? }
const isOwner = computed(() => {
  return authUser?.slug === route.params.slug;
});

onMounted(async () => {
  try {
    const { data } = await getEntrepriseBySlug(route.params.slug as string);
    entreprise.value = data;
  } catch (err) {
    console.error("❌ Erreur chargement entreprise :", err);
  } finally {
    loading.value = false;
  }
});
</script>
