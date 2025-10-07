<!-- src/components/agenda/AgendaSlot.vue -->
<!-- -------------------------------------------------------------
 Composant : Slot (créneau horaire)
---------------------------------------------------------------

📌 Description :
  - Affiche un créneau horaire sur la grille (agenda)
  - Permet le drag & drop vertical (admin uniquement)
  - Émet les événements d’édition, suppression, déplacement

📍 Événements émis :
  - edit(slot)    → ouverture du popup d’édition
  - remove(id)    → suppression du slot
  - slotMove({ id, newStart, newEnd }) → déplacement vertical terminé

🔒 Règles d’accès :
  - Public : lecture seule
  - Admin : drag & drop, édition, suppression

⚠️ Remarques :
  - Le déplacement est purement vertical (jour inchangé)
  - Snap automatique sur les quarts d’heure
  - L’animation utilise transform/translate pour fluidité visuelle
------------------------------------------------------------- -->

<template>
  <div
    class="absolute left-1 right-1 bg-red-800 text-white rounded p-1 text-xs shadow flex flex-col select-none cursor-grab active:cursor-grabbing"
    :style="[slotStyle(slot), { transform: translateY }]"
    @mousedown="onMouseDown"
  >
    <!-- Header du slot -->
    <div class="flex justify-between items-center">
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

    <!-- Heures -->
    <span class="text-[10px] opacity-80">
      {{ formatHour(slot.start) }} - {{ formatHour(slot.end) }}
    </span>
  </div>
</template>

<script setup lang="ts">
// -------------------------------------------------------------
// Imports
// -------------------------------------------------------------
import { ref, onBeforeUnmount } from "vue";
import type { Slot } from "../../services/slots";

// -------------------------------------------------------------
// Props & Emits
// -------------------------------------------------------------
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
}>();

// -------------------------------------------------------------
// États internes
// -------------------------------------------------------------
const translateY = ref("translateY(0px)");
let startY = 0;
let originalStart: Date;
let originalEnd: Date;
let isDragging = false;

// Hauteur d’une heure (en pixels, à ajuster selon ta grille réelle)
const HOUR_HEIGHT = 48; // ≈ 1h = 48px → 15min = 12px

// -------------------------------------------------------------
// Utils
// -------------------------------------------------------------
function snapToQuarter(date: Date): Date {
  const min = date.getMinutes();
  const snapped = Math.round(min / 15) * 15;
  date.setMinutes(snapped, 0, 0);
  return date;
}

function minutesToPixels(minutes: number): number {
  return (minutes / 60) * HOUR_HEIGHT;
}

function pixelsToMinutes(pixels: number): number {
  return (pixels / HOUR_HEIGHT) * 60;
}

// -------------------------------------------------------------
// Drag & drop
// -------------------------------------------------------------
function onMouseDown(event: MouseEvent) {
  if (!props.isAdmin) return; // lecture seule pour public

  event.preventDefault();
  startY = event.clientY;
  originalStart = new Date(props.slot.start);
  originalEnd = new Date(props.slot.end);
  isDragging = true;

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
}

function onMouseMove(event: MouseEvent) {
  if (!isDragging) return;

  const deltaY = event.clientY - startY;
  translateY.value = `translateY(${deltaY}px)`;
}

function onMouseUp(event: MouseEvent) {
  if (!isDragging) return;
  isDragging = false;

  const deltaY = event.clientY - startY;
  const deltaMinutes = pixelsToMinutes(deltaY);

  // Recalcul des nouvelles heures
  const newStart = new Date(originalStart);
  const newEnd = new Date(originalEnd);
  newStart.setMinutes(newStart.getMinutes() + deltaMinutes);
  newEnd.setMinutes(newEnd.getMinutes() + deltaMinutes);

  // Snap 15 min
  const snappedStart = snapToQuarter(newStart);
  const snappedEnd = snapToQuarter(newEnd);

  // Réinitialise la position visuelle
  translateY.value = "translateY(0px)";

  // Émet l’événement vers Agenda.vue
  emit("slotMove", {
    id: props.slot.id,
    newStart: snappedStart.toISOString(),
    newEnd: snappedEnd.toISOString(),
  });

  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
}

// Nettoyage si on quitte la page pendant un drag
onBeforeUnmount(() => {
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
});
</script>

<style scoped>
/* Animation fluide pendant le drag */
div {
  transition: transform 0.05s linear;
}
</style>
