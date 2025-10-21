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
        @updated="() => fetchMissions(true)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { listMissions, type MissionWithRelations } from "../../services/missions";
import MissionCard from "./MissionCard.vue";

const props = defineProps<{
  isOwner: boolean; // indique si l’utilisateur est admin de cette entreprise
  missions?: MissionWithRelations[];
}>();

const internalMissions = ref<MissionWithRelations[]>([]);
const externalMissions = ref<MissionWithRelations[]>([]);
const internalLoading = ref(false);

const hasExternalMissions = computed(() => props.missions !== undefined);

watch(
  () => props.missions,
  (value) => {
    if (value) {
      externalMissions.value = [...value];
    } else {
      externalMissions.value = [];
    }
  },
  { immediate: true, deep: true }
);

const missions = computed(() =>
  hasExternalMissions.value ? externalMissions.value : internalMissions.value
);
const loading = computed(() =>
  hasExternalMissions.value ? false : internalLoading.value
);

async function fetchMissions(force = false) {
  if (hasExternalMissions.value && !force) return;
  internalLoading.value = true;
  try {
    const { missions: data } = await listMissions();
    if (hasExternalMissions.value) {
      externalMissions.value = data;
    } else {
      internalMissions.value = data;
    }
  } catch (err) {
    console.error("❌ Erreur récupération missions:", err);
  } finally {
    internalLoading.value = false;
  }
}

// 🔄 recharge quand les droits changent (owner uniquement)
watch(
  () => props.isOwner,
  (isOwner) => {
    if (isOwner) fetchMissions();
  },
  { immediate: true }
);

onMounted(() => {
  if (props.isOwner && missions.value.length === 0) {
    fetchMissions();
  }
});

watch(
  () => props.missions,
  (value) => {
    if (value === undefined && props.isOwner) {
      fetchMissions();
    }
  }
);
</script>
