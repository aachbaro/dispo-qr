<template>
  <div v-if="isAdmin" class="space-y-4">
    <h2 class="text-xl font-bold">Vos missions</h2>

    <div v-if="loading" class="text-gray-500">Chargement...</div>
    <div v-else-if="missions.length === 0" class="text-gray-500">
      Aucune mission pour le moment.
    </div>

    <div class="grid gap-4">
      <MissionCard
        v-for="mission in missions"
        :key="mission.id"
        :mission="mission"
        @updated="fetchMissions"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { listMissions } from "../services/missions";
import MissionCard from "./MissionCard.vue";
import useAdmin from "../composables/useAdmin";

const { isAdmin } = useAdmin();

const missions = ref([]);
const loading = ref(false);

async function fetchMissions() {
  loading.value = true;
  try {
    const { missions: data } = await listMissions();
    missions.value = data;
  } catch (err) {
    console.error("Erreur récupération missions:", err);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  if (isAdmin.value) {
    fetchMissions();
  }
});
</script>