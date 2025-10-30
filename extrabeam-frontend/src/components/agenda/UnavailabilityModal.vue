<!-- src/components/agenda/UnavailabilityModal.vue -->
<template>
  <Transition name="fade">
    <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50" @click="$emit('close')" />
      <div
        class="relative w-full max-w-md rounded-lg bg-white shadow-lg ring-1 ring-black/5"
      >
        <div class="px-5 py-4 border-b">
          <h2 class="text-lg font-semibold">Indisponibilité récurrente</h2>
          <p class="mt-1 text-xs text-gray-500">
            {{ weekdayLabel }} • {{ formatHour(occurrence.start) }}–{{ formatHour(occurrence.end) }}
          </p>
        </div>

        <div class="space-y-4 px-5 py-4">
          <div class="space-y-1">
            <label class="text-sm font-medium">Titre</label>
            <input
              v-model="localTitle"
              type="text"
              class="w-full rounded-full border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-sm font-medium">Heure début</label>
              <input
                v-model="localStartTime"
                type="time"
                step="900"
                class="w-full rounded-full border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium">Heure fin</label>
              <input
                v-model="localEndTime"
                type="time"
                step="900"
                class="w-full rounded-full border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-sm font-medium">Jour de la semaine</label>
            <select
              v-model.number="localWeekday"
              class="w-full rounded-full border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option v-for="(d, i) in daysOfWeek" :key="i" :value="i">{{ d }}</option>
            </select>
          </div>

          <div class="space-y-1">
            <label class="text-sm font-medium">Fin de récurrence (optionnel)</label>
            <input
              v-model="localRecurrenceEnd"
              type="date"
              class="w-full rounded-full border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p class="text-xs text-gray-500">Laissez vide pour « sans fin ».</p>
          </div>

          <div class="flex flex-wrap gap-2 pt-2">
            <button class="btn-primary" @click="updateSeries">Mettre à jour la récurrence</button>
            <button class="btn-primary bg-red-600 hover:bg-red-700" @click="deleteSeries">
              Supprimer toute la récurrence
            </button>
            <button class="btn-primary bg-amber-600 hover:bg-amber-700" @click="deleteOccurrence">
              Supprimer cette occurrence
            </button>
          </div>
        </div>

        <div class="flex justify-end border-t px-5 py-3">
          <button class="btn-primary" @click="$emit('close')">Fermer</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { updateUnavailability, deleteUnavailability } from "../../services/unavailabilities";
import type { AgendaDisplaySlot } from "../../composables/agenda/useAgendaSlots";

const props = defineProps<{
  open: boolean;
  slug: string;
  occurrence: Extract<AgendaDisplaySlot, { type: "unavailability" }>;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "updated"): void;
  (e: "deleted"): void;
}>();

const daysOfWeek = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
];

const localTitle = ref("Indisponible");
const localStartTime = ref("00:00");
const localEndTime = ref("00:00");
const localWeekday = ref(0);
const localRecurrenceEnd = ref("");

watch(
  () => props.occurrence,
  (occ) => {
    if (!occ) return;
    localTitle.value = occ.title || "Indisponible";
    localStartTime.value = occ.start_time;
    localEndTime.value = occ.end_time;
    localWeekday.value = occ.weekday ?? new Date(occ.start_date).getDay();
    localRecurrenceEnd.value = occ.recurrence_end ?? "";
  },
  { immediate: true }
);

const weekdayLabel = computed(() => daysOfWeek[localWeekday.value] ?? "");

function formatHour(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function updateSeries() {
  try {
    await updateUnavailability(props.slug, Number(props.occurrence.id), {
      title: localTitle.value,
      start_time: localStartTime.value,
      end_time: localEndTime.value,
      weekday: localWeekday.value,
      recurrence_end: localRecurrenceEnd.value || null,
    });
    emit("updated");
  } catch (error) {
    console.error("❌ Update série:", error);
  }
}

async function deleteOccurrence() {
  try {
    await deleteUnavailability(
      props.slug,
      Number(props.occurrence.id),
      props.occurrence.start_date
    );
    emit("deleted");
  } catch (error) {
    console.error("❌ Delete occurrence:", error);
  }
}

async function deleteSeries() {
  try {
    await deleteUnavailability(props.slug, Number(props.occurrence.id));
    emit("deleted");
  } catch (error) {
    console.error("❌ Delete série:", error);
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.btn-primary {
  @apply rounded-full bg-blue-600 px-3 py-2 text-white transition hover:bg-blue-700;
}
</style>
