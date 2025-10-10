<!-- src/components/agenda/Agenda.vue -->
<!-- -------------------------------------------------------------
 Composant principal : Agenda hebdomadaire
---------------------------------------------------------------

📌 Description :
  - Affiche la vue agenda complète (entête + colonnes + créneaux)
  - Centralise la logique des slots (lecture / création / drag / suppression)
  - Gère la navigation par semaine et l’ouverture des popups

📍 Comportement :
  - Drag vertical d’un slot → déplacement fluide (snap 15min)
  - Clic sur la grille → création d’un nouveau créneau (ghost slot)
  - Double popup :
    • Admin → SelectionPopup (création de slots)
    • Client → ClientPopup (envoi de mission)
  - Navigation semaine suivante / précédente

🔒 Règles d’accès :
  - Admin → accès complet (CRUD + drag)
  - Public/client → lecture seule + création de mission

⚠️ Remarques :
  - Chaque jour est rendu via AgendaDayColumn.vue
  - Les slots sont fournis par useAgendaSlots()
  - Les popups s’ouvrent via useAgendaSelection()
------------------------------------------------------------- -->

<template>
  <div class="flex flex-col h-full w-full">
    <!-- 🧭 En-tête -->
    <AgendaHeader
      :is-admin="isAdmin"
      :week-label="weekLabel"
      :is-current-week="isCurrentWeek"
      @addSlot="openQuickAddSlot"
      @prevWeek="previousWeek"
      @nextWeek="nextWeek"
      @datePicked="onDatePicked"
    />

    <!-- 🗓️ Corps principal -->
    <div class="flex w-full h-[70vh] overflow-x-auto snap-x snap-mandatory">
      <!-- Colonne des heures -->
      <div
        class="w-14 flex-shrink-0 flex flex-col border-r border-black-600 text-xs text-back-500"
      >
        <div class="h-12"></div>
        <div
          v-for="(hour, hIndex) in hours"
          :key="'hour-' + hIndex"
          class="flex-1 flex items-start justify-end pr-1"
        >
          {{ hour }}
        </div>
      </div>

      <!-- Colonnes des jours -->
      <AgendaDayColumn
        v-for="(day, index) in days"
        :key="index"
        :day="day"
        :slots="daySlots(day.fullDate)"
        :is-admin="isAdmin"
        :slot-style="slotStyle"
        :format-hour="formatHour"
        @createSlot="handleCreateSlot"
        @slotEdit="handleSlotEdit"
        @slotRemove="handleSlotRemove"
        @removeOccurrence="removeUnavailabilityOccurrence"
        @slotMove="moveSlot"
        @slotResize="moveSlot"
      />
    </div>

    <!-- 🪟 Popups -->
    <SelectionPopup
      v-if="currentSelection"
      v-model:open="showPopup"
      :slug="slug"
      :initial-date="currentSelection.date"
      :initial-start="currentSelection.start"
      :initial-end="currentSelection.end"
      @created="handleSlotCreated"
      @cancel="handleCancel"
    />

    <ClientPopup
      v-if="!isAdmin && currentSelection"
      :open="showPopup"
      :slug="slug"
      :initial-date="currentSelection.date"
      :initial-start="currentSelection.start"
      :initial-end="currentSelection.end"
      @created="handleClientMission"
      @close="showPopup = false"
    />
  </div>
</template>

<script setup lang="ts">
// -------------------------------------------------------------
// Imports
// -------------------------------------------------------------
import AgendaHeader from "./AgendaHeader.vue";
import AgendaDayColumn from "./AgendaDayColumn.vue";
import SelectionPopup from "../SelectionPopup.vue";
import ClientPopup from "../missions/ClientPopup.vue";

import { useAgendaNavigation } from "../../composables/agenda/useAgendaNavigation";
import {
  useAgendaSlots,
  type AgendaDisplaySlot,
} from "../../composables/agenda/useAgendaSlots";
import { useAgendaSelection } from "../../composables/agenda/useAgendaSelection";
import {
  deleteUnavailability,
} from "../../services/unavailabilities";
import type { Slot } from "../../services/slots";

// -------------------------------------------------------------
// Props
// -------------------------------------------------------------
const props = defineProps<{
  slug: string;
  isAdmin: boolean;
}>();

// -------------------------------------------------------------
// Navigation (semaines, dates)
// -------------------------------------------------------------
const {
  weekLabel,
  isCurrentWeek,
  days,
  nextWeek,
  previousWeek,
  onDatePicked,
  activeWeek, // 👈 on l’ajoute ici
} = useAgendaNavigation();

// -------------------------------------------------------------
// Slots (lecture, création, suppression, déplacement)
// -------------------------------------------------------------
const {
  daySlots,
  editSlot,
  removeSlot,
  moveSlot,
  handleSlotCreated,
  slotStyle,
  formatHour,
  fetchCurrentWeek,
} = useAgendaSlots(props.slug, props.isAdmin, activeWeek);

// -------------------------------------------------------------
// Sélection (création client / admin + popups)
// -------------------------------------------------------------
const {
  currentSelection,
  showPopup,
  handleCreateSlot,
  handleCancel,
  handleClientMission,
} = useAgendaSelection();

// -------------------------------------------------------------
// Constantes locales
// -------------------------------------------------------------
const hours = Array.from(
  { length: 17 },
  (_, i) => `${String(i + 7).padStart(2, "0")}:00`
);

// -------------------------------------------------------------
// Quick add slot (bouton +)
// -------------------------------------------------------------
function openQuickAddSlot() {
  if (!props.isAdmin) return;
  const today = new Date();
  const date = today.toLocaleDateString("fr-CA");
  const hour = today.getHours();
  const start = `${String(hour).padStart(2, "0")}:00`;
  const end = `${String(hour + 1).padStart(2, "0")}:00`;

  currentSelection.value = { date, start, end };
  showPopup.value = true;
}

// -------------------------------------------------------------
// ❌ Suppression d’une occurrence d’indisponibilité
// -------------------------------------------------------------
async function removeUnavailabilityOccurrence(
  slot: Extract<AgendaDisplaySlot, { type: "unavailability" }>
) {
  if (!props.isAdmin) return;
  try {
    await deleteUnavailability(props.slug, Number(slot.id), slot.start_date);
    await fetchCurrentWeek();
  } catch (e) {
    console.error("❌ Erreur suppression occurrence:", e);
  }
}

function handleSlotEdit(slot: Slot) {
  editSlot(slot.id, slot);
}

function handleSlotRemove(id: number) {
  removeSlot(id);
}
</script>
