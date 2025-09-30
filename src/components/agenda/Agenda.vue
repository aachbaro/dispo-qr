<template>
  <div class="flex flex-col h-full w-full">
    <!-- Header -->
    <AgendaHeader
      :is-admin="isAdmin"
      :week-label="weekLabel"
      :is-current-week="isCurrentWeek"
      @addSlot="openQuickAddSlot"
      @prevWeek="previousWeek"
      @nextWeek="nextWeek"
      @datePicked="onDatePicked"
    />

    <!-- Agenda Body -->
    <div class="flex w-full h-[70vh] overflow-x-auto snap-x snap-mandatory">
      <!-- Hours column -->
      <div
        class="w-14 flex-shrink-0 flex flex-col border-r border-black-600 text-xs text-back-500"
      >
        <div class="h-12"></div>
        <!-- empty header space -->
        <div
          v-for="(hour, hIndex) in hours"
          :key="'hour-' + hIndex"
          class="flex-1 flex items-start justify-end pr-1"
        >
          {{ hour }}
        </div>
      </div>

      <!-- Days columns -->
      <AgendaDayColumn
        v-for="(day, index) in days"
        :key="index"
        :day="day"
        :slots="daySlots(day.fullDate)"
        :is-admin="isAdmin"
        :is-selected="isSelected"
        :slot-style="slotStyle"
        :format-hour="formatHour"
        @selectStart="startSelection"
        @selectExtend="extendSelection"
        @selectEnd="endSelection"
        @slotEdit="editSlot"
        @slotRemove="removeSlot"
      />
    </div>

    <!-- Popups -->
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
import AgendaHeader from "./AgendaHeader.vue";
import AgendaDayColumn from "./AgendaDayColumn.vue";
import SelectionPopup from "../SelectionPopup.vue";
import ClientPopup from "../missions/ClientPopup.vue";

import { useAgendaNavigation } from "../../composables/agenda/useAgendaNavigation";
import { useAgendaSlots } from "../../composables/agenda/useAgendaSlots";
import { useAgendaSelection } from "../../composables/agenda/useAgendaSelection";

const props = defineProps<{
  slug: string;
  isAdmin: boolean;
}>();

// navigation
const { weekLabel, isCurrentWeek, days, nextWeek, previousWeek, onDatePicked } =
  useAgendaNavigation();

// slots
const {
  daySlots,
  addSlot,
  editSlot,
  removeSlot,
  handleSlotCreated,
  slotStyle,
  formatHour,
} = useAgendaSlots(props.slug, props.isAdmin);

// selection
const {
  currentSelection,
  showPopup,
  startSelection,
  extendSelection,
  endSelection,
  isSelected,
  handleCancel,
  handleClientMission,
} = useAgendaSelection();

// Hours list
const hours = Array.from(
  { length: 17 },
  (_, i) => `${String(i + 7).padStart(2, "0")}:00`
);

// Quick add slot
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
</script>
