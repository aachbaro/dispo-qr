<!-- src/components/agenda/AgendaSlot.vue -->
<!-- -------------------------------------------------------------
 Composant : Slot (créneau horaire)
---------------------------------------------------------------

📌 Description :
  - Affiche un créneau horaire dans la grille agenda.
  - Permet à l’admin de :
      • Déplacer verticalement un slot (drag & drop)
      • Redimensionner par les bords haut/bas
  - Affiche le déplacement et le redimensionnement en temps réel.

📍 Événements émis :
  - edit(slot)
  - remove(id)
  - slotMove({ id, newStart, newEnd })
  - slotResize({ id, newStart, newEnd })

🔒 Règles d’accès :
  - Public → lecture seule
  - Admin → drag, resize, édition, suppression

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
    class="slot absolute left-1 right-1 bg-red-800 text-white rounded p-1 text-xs shadow flex flex-col select-none"
    :class="{ dragging: isDragging }"
    :style="slotDynamicStyle"
    @mousedown="onMouseDown"
  >
    <!-- 🔼 Handle supérieur -->
    <div
      v-if="isAdmin"
      class="absolute top-0 left-0 right-0 h-2 cursor-ns-resize bg-transparent"
      @mousedown.stop="onResizeStart('top', $event)"
    ></div>

    <!-- 🧩 Contenu -->
    <div
      class="flex justify-between items-center cursor-grab active:cursor-grabbing"
    >
      <span class="font-semibold truncate">{{
        slot.title || "Sans titre"
      }}</span>
      <div v-if="isAdmin" class="flex gap-1">
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
      v-if="isAdmin"
      class="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize bg-transparent"
      @mousedown.stop="onResizeStart('bottom', $event)"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from "vue";
import type { Slot } from "../../services/slots";

const props = defineProps<{
  slot: Slot;
  isAdmin: boolean;
  slotStyle: (slot: Slot) => Record<string, string>;
  formatHour: (dateString: string) => string;
}>();

const emit = defineEmits<{
  (e: "edit", slot: Slot): void;
  (e: "remove", id: number): void;
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

const localStart = ref(props.slot.start);
const localEnd = ref(props.slot.end);

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
// 🎯 Drag & Resize logique
// -------------------------------------------------------------
function onMouseDown(event: MouseEvent) {
  if (!props.isAdmin) return;
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

  // ----------------------------------
  // Déplacement complet (drag global)
  // ----------------------------------
  if (mode === "move") {
    newStart.setMinutes(newStart.getMinutes() + deltaMinutes);
    newEnd.setMinutes(newEnd.getMinutes() + deltaMinutes);

    const duration = newEnd.getTime() - newStart.getTime();

    // Si on dépasse vers le haut → bloque à 07:00
    const minLimit = new Date(originalStart);
    minLimit.setHours(DAY_START_HOUR, 0, 0, 0);
    if (newStart < minLimit) {
      newStart = new Date(minLimit);
      newEnd = new Date(newStart.getTime() + duration);
    }

    // Si on dépasse vers le bas → bloque à 23:59
    const maxLimit = new Date(originalStart);
    maxLimit.setHours(23, 59, 0, 0);
    const maxEnd = new Date(maxLimit);
    maxEnd.setMinutes(maxEnd.getMinutes()); // même jour
    if (newEnd > maxLimit) {
      newEnd = new Date(maxLimit);
      newStart = new Date(newEnd.getTime() - duration);
    }
  }

  // ----------------------------------
  // Resize haut
  // ----------------------------------
  if (mode === "resize-top") {
    newStart.setMinutes(newStart.getMinutes() + deltaMinutes);
    if (newEnd.getTime() - newStart.getTime() < MIN_DURATION_MIN * 60000) {
      newStart = new Date(newEnd.getTime() - MIN_DURATION_MIN * 60000);
    }
    if (newStart.getHours() < DAY_START_HOUR) {
      newStart.setHours(DAY_START_HOUR, 0, 0, 0);
    }
  }

  // ----------------------------------
  // Resize bas
  // ----------------------------------
  if (mode === "resize-bottom") {
    newEnd.setMinutes(newEnd.getMinutes() + deltaMinutes);
    if (newEnd.getTime() - newStart.getTime() < MIN_DURATION_MIN * 60000) {
      newEnd = new Date(newStart.getTime() + MIN_DURATION_MIN * 60000);
    }
    // Bloque à minuit
    const maxEnd = new Date(originalEnd);
    maxEnd.setHours(23, 59, 0, 0);
    if (newEnd > maxEnd) newEnd = new Date(maxEnd);
  }

  // Clamp final
  newStart = clampToDayBounds(newStart);
  newEnd = clampToDayBounds(newEnd);

  // Application directe
  localStart.value = snapToQuarter(newStart).toISOString();
  localEnd.value = snapToQuarter(newEnd).toISOString();
}

// -------------------------------------------------------------
// 🔚 Fin du drag ou resize
// -------------------------------------------------------------
function onMouseUp() {
  if (!mode) return;

  const finalStart = new Date(localStart.value);
  const finalEnd = new Date(localEnd.value);
  isDragging.value = false;

  emit(mode === "move" ? "slotMove" : "slotResize", {
    id: props.slot.id,
    newStart: finalStart.toISOString(),
    newEnd: finalEnd.toISOString(),
  });

  mode = null;
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
}

// -------------------------------------------------------------
// Resize Start
// -------------------------------------------------------------
function onResizeStart(direction: "top" | "bottom", event: MouseEvent) {
  if (!props.isAdmin) return;
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
