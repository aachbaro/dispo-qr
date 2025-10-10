<!-- src/components/agenda/AgendaSlot.vue -->
<!-- -------------------------------------------------------------
 Composant : Slot (créneau horaire) ou Indisponibilité
---------------------------------------------------------------

📌 Description :
  - Affiche un créneau horaire dans la grille agenda.
  - Peut représenter soit :
      • un slot classique (mission / travail)
      • une indisponibilité récurrente (grisée, non interactive)
  - Gère le drag, resize, édition et suppression uniquement
    pour les slots normaux.

📍 Événements émis :
  - edit(slot)
  - remove(id)
  - slotMove({ id, newStart, newEnd })
  - slotResize({ id, newStart, newEnd })

🔒 Règles d’accès :
  - Public → lecture seule
  - Admin → drag, resize, édition, suppression (slots uniquement)
  - Indisponibilités → lecture seule

⚠️ Remarques :
  - Feedback 1:1 avec la souris.
  - Snap automatique sur les quarts d’heure.
  - Restrictions :
      • Durée min. = 15 min
      • Ne peut pas dépasser minuit
      • Ne peut pas remonter avant 07:00
------------------------------------------------------------- -->

<template>
  <div
    class="slot absolute left-1 right-1 rounded p-1 text-xs shadow flex flex-col select-none"
    :class="{
      dragging: isDragging,
      'bg-red-800 text-white': slot.type === 'slot',
      'bg-gray-400 text-gray-900 opacity-60': slot.type === 'unavailability',
    }"
    :style="slotDynamicStyle"
    @mousedown="onMouseDown"
  >
    <!-- 🔼 Handle supérieur -->
    <div
      v-if="isAdmin && slot.type === 'slot'"
      class="absolute top-0 left-0 right-0 h-2 cursor-ns-resize bg-transparent"
      @mousedown.stop="onResizeStart('top', $event)"
    ></div>

    <!-- 🧩 Contenu -->
    <div
      class="flex justify-between items-center"
      :class="{
        'cursor-grab active:cursor-grabbing': isAdmin && slot.type === 'slot',
        'cursor-default': slot.type === 'unavailability',
      }"
    >
      <span class="font-semibold truncate">
        {{
          slot.title ||
          (slot.type === "unavailability" ? "Indisponible" : "Sans titre")
        }}
      </span>

      <div v-if="isAdmin && slot.type === 'slot'" class="flex gap-1">
        <button @click.stop="$emit('edit', slot)" class="hover:text-yellow-300">
          ✏️
        </button>
        <button
          @click.stop="$emit('remove', slot.id)"
          class="hover:text-gray-300"
        >
          ❌
        </button>
      </div>
    </div>

    <!-- 🕒 Horaires -->
    <span class="text-[10px] opacity-80">
      {{ formatHour(localStart) }} - {{ formatHour(localEnd) }}
    </span>

    <!-- 🔽 Handle inférieur -->
    <div
      v-if="isAdmin && slot.type === 'slot'"
      class="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize bg-transparent"
      @mousedown.stop="onResizeStart('bottom', $event)"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from "vue";
import type { Slot } from "../../services/slots";
import type { Unavailability } from "../../services/unavailabilities";

const props = defineProps<{
  slot: Slot | (Unavailability & { type?: string });
  isAdmin: boolean;
  slotStyle: (slot: Slot | Unavailability) => Record<string, string>;
  formatHour: (dateString: string) => string;
}>();

const emit = defineEmits<{
  (e: "edit", slot: Slot): void;
  (e: "remove", id: number | string): void;
  (
    e: "slotMove",
    payload: { id: number; newStart: string; newEnd: string }
  ): void;
  (
    e: "slotResize",
    payload: { id: number; newStart: string; newEnd: string }
  ): void;
}>();

// -------------------------------------------------------------
// État interne
// -------------------------------------------------------------
const isDragging = ref(false);
let startY = 0;
let originalStart: Date;
let originalEnd: Date;
let mode: "move" | "resize-top" | "resize-bottom" | null = null;

const localStart = ref(
  props.slot.start || `${props.slot.start_date}T${props.slot.start_time}`
);
const localEnd = ref(
  props.slot.end || `${props.slot.start_date}T${props.slot.end_time}`
);

const HOUR_HEIGHT = 48;
const MIN_DURATION_MIN = 15;
const DAY_START_HOUR = 7;
const DAY_END_HOUR = 24;

// -------------------------------------------------------------
// Utils
// -------------------------------------------------------------
function snapToQuarter(date: Date): Date {
  const min = date.getMinutes();
  const snapped = Math.round(min / 15) * 15;
  date.setMinutes(snapped, 0, 0);
  return date;
}

function pixelsToMinutes(pixels: number): number {
  return (pixels / HOUR_HEIGHT) * 60;
}

function clampToDayBounds(date: Date): Date {
  const d = new Date(date);
  if (d.getHours() < DAY_START_HOUR) d.setHours(DAY_START_HOUR, 0, 0, 0);
  if (d.getHours() >= DAY_END_HOUR) d.setHours(23, 59, 0, 0);
  return d;
}

// -------------------------------------------------------------
// Style dynamique
// -------------------------------------------------------------
const slotDynamicStyle = computed(() => {
  const s = new Date(localStart.value);
  const e = new Date(localEnd.value);
  return props.slotStyle({
    ...props.slot,
    start: s.toISOString(),
    end: e.toISOString(),
  });
});

// -------------------------------------------------------------
// 🎯 Drag & Resize logique (slots uniquement)
// -------------------------------------------------------------
function onMouseDown(event: MouseEvent) {
  if (!props.isAdmin || props.slot.type === "unavailability") return;
  event.preventDefault();

  mode = "move";
  startY = event.clientY;
  originalStart = new Date(localStart.value);
  originalEnd = new Date(localEnd.value);
  isDragging.value = true;

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
}

function onMouseMove(event: MouseEvent) {
  if (!mode) return;
  const deltaY = event.clientY - startY;
  const deltaMinutes = pixelsToMinutes(deltaY);

  let newStart = new Date(originalStart);
  let newEnd = new Date(originalEnd);

  if (mode === "move") {
    newStart.setMinutes(newStart.getMinutes() + deltaMinutes);
    newEnd.setMinutes(newEnd.getMinutes() + deltaMinutes);
  }

  if (mode === "resize-top") {
    newStart.setMinutes(newStart.getMinutes() + deltaMinutes);
    if (newEnd.getTime() - newStart.getTime() < MIN_DURATION_MIN * 60000)
      newStart = new Date(newEnd.getTime() - MIN_DURATION_MIN * 60000);
  }

  if (mode === "resize-bottom") {
    newEnd.setMinutes(newEnd.getMinutes() + deltaMinutes);
    if (newEnd.getTime() - newStart.getTime() < MIN_DURATION_MIN * 60000)
      newEnd = new Date(newStart.getTime() + MIN_DURATION_MIN * 60000);
  }

  newStart = clampToDayBounds(snapToQuarter(newStart));
  newEnd = clampToDayBounds(snapToQuarter(newEnd));

  localStart.value = newStart.toISOString();
  localEnd.value = newEnd.toISOString();
}

function onMouseUp() {
  if (!mode) return;
  const finalStart = new Date(localStart.value);
  const finalEnd = new Date(localEnd.value);
  isDragging.value = false;

  emit(mode === "move" ? "slotMove" : "slotResize", {
    id: props.slot.id as number,
    newStart: finalStart.toISOString(),
    newEnd: finalEnd.toISOString(),
  });

  mode = null;
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
}

function onResizeStart(direction: "top" | "bottom", event: MouseEvent) {
  if (!props.isAdmin || props.slot.type === "unavailability") return;
  event.preventDefault();
  event.stopPropagation();

  mode = direction === "top" ? "resize-top" : "resize-bottom";
  startY = event.clientY;
  originalStart = new Date(localStart.value);
  originalEnd = new Date(localEnd.value);
  isDragging.value = true;

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
}

// -------------------------------------------------------------
// Cleanup
// -------------------------------------------------------------
onBeforeUnmount(() => {
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
});
</script>

<style scoped>
.slot {
  transition: top 0.15s cubic-bezier(0.2, 0.9, 0.4, 1),
    height 0.15s cubic-bezier(0.2, 0.9, 0.4, 1);
}
.slot.dragging {
  transition: none !important;
}
</style>
