<!-- src/components/agenda/AgendaDayColumn.vue -->
<!-- -------------------------------------------------------------
 Colonne d’un jour dans l’agenda hebdomadaire
---------------------------------------------------------------

📌 Description :
  - Affiche les créneaux horaires (par pas de 15 min)
  - Gère la création fluide d’un "ghost slot" pendant le drag
  - Gère également la propagation du déplacement d’un slot (drag vertical)
  - Affiche les slots existants positionnés sur la grille

📍 Comportement :
  - Clic + drag → création d’un bloc rouge semi-transparent ("ghost slot")
  - Relâchement → ouvre le popup de sélection prérempli
  - Drag sur un slot → déplacement vertical fluide (snap 15 min)
  - Slots officiels affichés en rouge foncé, ghost slot en rouge clair

🔒 Règles d’accès :
  - Slots : visibles pour tous
  - Interaction (création/suppression/édition/déplacement) : réservée à l’owner/admin

⚠️ Remarques :
  - Chaque heure conserve la même hauteur qu’avant (1 unité = 60min)
  - Grille divisée en 4 sous-unités de 15min (visuellement identiques)
  - Calcul du positionnement basé sur minutes depuis 7h00
------------------------------------------------------------- -->

<template>
  <div
    class="flex-1 h-full flex-shrink-0 snap-center border-r border-back flex flex-col relative"
  >
    <!-- 🗓️ En-tête du jour -->
    <div
      class="h-12 flex flex-col items-center justify-center bg-back-100 border-b border-black-600 shrink-0"
    >
      <span class="text-sm font-medium">{{ day.name }}</span>
      <span class="text-xs text-back-500">{{ day.date }}</span>
    </div>

    <!-- 🕒 Grille horaire (chaque ligne = 15 min) -->
    <div
      class="flex-1 grid relative"
      :style="{ gridTemplateRows: 'repeat(' + totalQuarters + ', 1fr)' }"
      @mouseleave="onLeave"
    >
      <!-- 📍 Cases horaires -->
      <div
        v-for="(quarter, qIndex) in quarters"
        :key="qIndex"
        class="border-b border-black-600/10 flex items-start justify-center text-[10px] text-back-400 cursor-pointer select-none"
        :class="{
          'border-black-600': qIndex % 4 === 0, // ligne plus marquée à chaque heure
          'hover:bg-blue-50': !isDragging,
        }"
        @mousedown="onMouseDown(day.fullDate, quarter)"
        @mouseover="onMouseOver(day.fullDate, quarter)"
        @mouseup="onMouseUp"
      >
        <!-- Affiche l'heure uniquement sur les lignes pleines -->
        <span
          v-if="qIndex % 4 === 0"
          class="absolute left-1 text-[10px] opacity-50"
        >
          {{ formatLabel(quarter) }}
        </span>
      </div>

      <!-- 🟥 Ghost slot (pendant sélection) -->
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
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// -------------------------------------------------------------
// Imports
// -------------------------------------------------------------
import { ref } from "vue";
import type { Slot } from "../../services/slots";
import AgendaSlot from "./AgendaSlot.vue";

// -------------------------------------------------------------
// Props & Emits
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
  ): void; // 👈 ajouté
  (e: "createSlot", range: { date: string; start: string; end: string }): void;
}>();

// -------------------------------------------------------------
// Constantes & États
// -------------------------------------------------------------
const totalHours = 17; // de 07:00 à 24:00
const totalQuarters = totalHours * 4;
const quarters = Array.from({ length: totalQuarters }, (_, i) => {
  const hour = Math.floor(i / 4) + 7;
  const min = (i % 4) * 15;
  return `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
});

const ghostSlot = ref<null | { start: string; end: string }>(null);
const isDragging = ref(false);
let dragStart: Date | null = null;

// -------------------------------------------------------------
// Utils
// -------------------------------------------------------------
function snapToQuarter(date: Date): Date {
  const minutes = date.getMinutes();
  const snapped = Math.round(minutes / 15) * 15;
  date.setMinutes(snapped, 0, 0);
  return date;
}

function formatLabel(hhmm: string) {
  const [h, m] = hhmm.split(":");
  return m === "00" ? `${h}h` : "";
}

// -------------------------------------------------------------
// Sélection fluide (création de slot)
// -------------------------------------------------------------
function onMouseDown(date: string, hour: string) {
  if (!props.isAdmin) return; // public = lecture seule
  isDragging.value = true;
  dragStart = snapToQuarter(new Date(`${date}T${hour}`));
  ghostSlot.value = {
    start: dragStart.toISOString(),
    end: dragStart.toISOString(),
  };
}

function onMouseOver(date: string, hour: string) {
  if (!isDragging.value || !dragStart) return;
  const current = snapToQuarter(new Date(`${date}T${hour}`));
  const start = dragStart < current ? dragStart : current;
  const end = dragStart < current ? current : dragStart;
  ghostSlot.value = { start: start.toISOString(), end: end.toISOString() };
}

function onMouseUp() {
  if (!ghostSlot.value) return;
  isDragging.value = false;

  emit("createSlot", {
    date: ghostSlot.value.start.split("T")[0],
    start: ghostSlot.value.start.split("T")[1].slice(0, 5),
    end: ghostSlot.value.end.split("T")[1].slice(0, 5),
  });

  ghostSlot.value = null;
}

function onLeave() {
  if (isDragging.value) {
    isDragging.value = false;
    ghostSlot.value = null;
  }
}

// -------------------------------------------------------------
// 🧩 Drag & drop des slots existants
// -------------------------------------------------------------
function onSlotMove(payload: { id: number; newStart: string; newEnd: string }) {
  emit("slotMove", payload); // 👉 propagation directe vers Agenda.vue
}
</script>

<style scoped>
.ghost-slot {
  transition: top 0.1s ease, height 0.1s ease;
}
</style>
