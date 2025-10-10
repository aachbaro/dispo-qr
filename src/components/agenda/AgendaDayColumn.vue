<!-- src/components/agenda/AgendaDayColumn.vue -->
<!-- -------------------------------------------------------------
 Composant : Colonne d’un jour dans l’agenda hebdomadaire
---------------------------------------------------------------

📌 Description :
  - Gère la création fluide d’un “ghost slot” lors d’un clic + drag.
  - Comportement identique aux slots réels :
      • Snap automatique (15 min)
      • Blocage entre 07:00 → 23:59
      • Durée minimale de 15 min
      • Mouvement 1:1 instantané
  - Le ghost reste visible même en dehors de la colonne, bloqué visuellement.

📍 Événements émis :
  - createSlot({ date, start, end }) → ouvre popup prérempli
  - slotMove({ id, newStart, newEnd })
  - slotResize({ id, newStart, newEnd })
  - slotEdit(slot)
  - slotRemove(id)

🔒 Règles :
  - Admin → peut créer de vrais slots (SelectionPopup)
  - Visiteur → peut sélectionner une plage (ClientPopup)
------------------------------------------------------------- -->

<template>
  <div
    class="flex-1 h-full flex-shrink-0 snap-center border-r border-back flex flex-col relative"
  >
    <!-- 🗓️ En-tête -->
    <div
      class="h-12 flex flex-col items-center justify-center bg-back-100 border-b border-black-600 shrink-0"
    >
      <span class="text-sm font-medium">{{ day.name }}</span>
      <span class="text-xs text-back-500">{{ day.date }}</span>
    </div>

    <!-- 🕒 Grille -->
    <div
      ref="gridRef"
      class="flex-1 grid relative select-none"
      :style="{ gridTemplateRows: 'repeat(' + totalQuarters + ', 1fr)' }"
      @mousedown="onMouseDown"
    >
      <!-- 📍 Lignes horaires -->
      <div
        v-for="(quarter, qIndex) in quarters"
        :key="qIndex"
        class="border-b border-black-600/10 flex items-start justify-center text-[10px] text-back-400"
        :class="{ 'border-black-600': qIndex % 4 === 0 }"
      >
        <span
          v-if="qIndex % 4 === 0"
          class="absolute left-1 text-[10px] opacity-50"
        >
          {{ formatLabel(quarter) }}
        </span>
      </div>

      <!-- 🟥 Ghost slot -->
      <div
        v-if="ghostSlot"
        class="absolute left-1 right-1 bg-red-500/60 rounded p-1 text-[10px] text-white shadow ghost-slot pointer-events-none"
        :style="slotStyle(ghostSlot)"
      >
        {{ formatHour(ghostSlot.start) }} - {{ formatHour(ghostSlot.end) }}
      </div>

      <!-- 🔴 Slots réels -->
      <AgendaSlot
        v-for="slot in slots"
        :key="slot.id + '-' + slot.start"
        :slot="slot"
        :is-admin="isAdmin"
        :slot-style="slotStyle"
        :format-hour="formatHour"
        @edit="$emit('slotEdit', $event)"
        @remove="$emit('slotRemove', $event)"
        @slotMove="onSlotMove"
        @slotResize="onSlotResize"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount } from "vue";
import type { Slot } from "../../services/slots";
import AgendaSlot from "./AgendaSlot.vue";

// -------------------------------------------------------------
// Props
// -------------------------------------------------------------
const props = defineProps<{
  day: { name: string; date: string; fullDate: string };
  slots: Slot[];
  isAdmin: boolean;
  slotStyle: (
    slot: Slot | { start: string; end: string }
  ) => Record<string, string>;
  formatHour: (dateString: string) => string;
}>();

const emit = defineEmits<{
  (e: "slotEdit", slot: Slot): void;
  (e: "slotRemove", id: number): void;
  (
    e: "slotMove",
    payload: { id: number; newStart: string; newEnd: string }
  ): void;
  (
    e: "slotResize",
    payload: { id: number; newStart: string; newEnd: string }
  ): void;
  (e: "createSlot", range: { date: string; start: string; end: string }): void;
}>();

// -------------------------------------------------------------
// Constantes & états
// -------------------------------------------------------------
const totalHours = 17;
const totalQuarters = totalHours * 4;
const quarters = Array.from({ length: totalQuarters }, (_, i) => {
  const hour = Math.floor(i / 4) + 7;
  const min = (i % 4) * 15;
  return `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
});

const gridRef = ref<HTMLElement | null>(null);
const ghostSlot = ref<null | { start: string; end: string }>(null);
const isCreating = ref(false);
let dragStart: Date | null = null;

const DAY_START_HOUR = 7;
const DAY_END_HOUR = 24;
const MIN_DURATION_MIN = 15;

// -------------------------------------------------------------
// Utils
// -------------------------------------------------------------
function snapToQuarter(date: Date): Date {
  const min = date.getMinutes();
  const snapped = Math.round(min / 15) * 15;
  date.setMinutes(snapped, 0, 0);
  return date;
}
function toTimeString(date: Date): string {
  return date.toTimeString().slice(0, 5);
}
function formatLabel(hhmm: string) {
  const [h, m] = hhmm.split(":");
  return m === "00" ? `${h}h` : "";
}

// -------------------------------------------------------------
// 📏 Création du ghost slot (admin + visiteurs)
// -------------------------------------------------------------
function onMouseDown(event: MouseEvent) {
  if (!gridRef.value) return;

  // ✅ Empêche la création si on clique sur un slot existant
  const target = event.target as HTMLElement;
  if (target.closest(".slot")) return;

  const grid = gridRef.value.getBoundingClientRect();
  const y = Math.min(Math.max(event.clientY - grid.top, 0), grid.height);
  const ratio = y / grid.height;
  const totalMinutes = totalHours * 60;
  const startMinutes = DAY_START_HOUR * 60 + ratio * totalMinutes;

  const start = new Date(`${props.day.fullDate}T00:00`);
  start.setMinutes(startMinutes);

  dragStart = snapToQuarter(start);
  ghostSlot.value = {
    start: dragStart.toISOString(),
    end: dragStart.toISOString(),
  };
  isCreating.value = true;

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
}

function onMouseMove(event: MouseEvent) {
  if (!isCreating.value || !dragStart || !gridRef.value) return;

  const grid = gridRef.value.getBoundingClientRect();
  const y = Math.min(Math.max(event.clientY - grid.top, 0), grid.height);
  const ratio = y / grid.height;
  const totalMinutes = totalHours * 60;
  const currentMinutes = DAY_START_HOUR * 60 + ratio * totalMinutes;

  const current = new Date(`${props.day.fullDate}T00:00`);
  current.setMinutes(currentMinutes);

  const snapped = snapToQuarter(current);
  let newStart = dragStart < snapped ? dragStart : snapped;
  let newEnd = dragStart < snapped ? snapped : dragStart;

  const duration = (newEnd.getTime() - newStart.getTime()) / 60000;
  if (duration < MIN_DURATION_MIN) return;

  // Limites horaires
  if (newStart.getHours() < DAY_START_HOUR)
    newStart.setHours(DAY_START_HOUR, 0, 0, 0);
  if (newEnd.getHours() >= DAY_END_HOUR) newEnd.setHours(23, 59, 0, 0);

  ghostSlot.value = {
    start: snapToQuarter(newStart).toISOString(),
    end: snapToQuarter(newEnd).toISOString(),
  };
}

function onMouseUp() {
  if (!isCreating.value || !ghostSlot.value) return;

  const start = new Date(ghostSlot.value.start);
  const end = new Date(ghostSlot.value.end);

  emit("createSlot", {
    date: props.day.fullDate,
    start: toTimeString(start),
    end: toTimeString(end),
  });

  ghostSlot.value = null;
  isCreating.value = false;
  dragStart = null;

  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
}

// -------------------------------------------------------------
// 🧩 Propagation des événements enfants
// -------------------------------------------------------------
function onSlotMove(payload: { id: number; newStart: string; newEnd: string }) {
  emit("slotMove", payload);
}
function onSlotResize(payload: {
  id: number;
  newStart: string;
  newEnd: string;
}) {
  emit("slotResize", payload);
}

onBeforeUnmount(() => {
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
});
</script>

<style scoped>
.ghost-slot {
  transition: none;
}
</style>
