<template>
  <div v-if="isOwner" class="space-y-4">
    <h2 class="text-xl font-bold">Vos missions</h2>

    <div v-if="loading" class="text-back-500">Chargement...</div>
    <div v-else-if="missions.length === 0" class="text-back-500">
      Aucune mission pour le moment.
    </div>

    <div class="grid gap-4">
      <MissionCard
        v-for="mission in missions"
        :key="mission.id"
        :mission="mission"
        :slug="slug"
        @updated="fetchMissions"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { listEntrepriseMissions } from "../../services/missions";
import MissionCard from "./MissionCard.vue";

const props = defineProps<{
  slug: string; // slug de l’entreprise (depuis EntreprisePage)
  isOwner: boolean; // indique si l’utilisateur est admin de cette entreprise
}>();

const missions = ref<any[]>([]);
const loading = ref(false);

async function fetchMissions() {
  if (!props.slug) return;
  loading.value = true;
  try {
    const { missions: data } = await listEntrepriseMissions(props.slug);
    missions.value = data;
  } catch (err) {
    console.error("❌ Erreur récupération missions:", err);
  } finally {
    loading.value = false;
  }
}

// 🔄 recharge quand le slug change
watch(() => props.slug, fetchMissions, { immediate: true });

onMounted(() => {
  if (props.isOwner) {
    fetchMissions();
  }
});
</script>
