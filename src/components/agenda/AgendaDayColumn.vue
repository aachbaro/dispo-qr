<template>
  <div
    class="flex-1 h-full flex-shrink-0 snap-center border-r border-back flex flex-col"
  >
    <!-- Day Header -->
    <div
      class="h-12 flex flex-col items-center justify-center bg-back-100 border-b border-black-600 shrink-0"
    >
      <span class="text-sm font-medium">{{ day.name }}</span>
      <span class="text-xs text-back-500">{{ day.date }}</span>
    </div>

    <!-- Hour grid -->
    <div class="flex-1 grid grid-rows-21 relative">
      <div
        v-for="(hour, hIndex) in hours"
        :key="hIndex"
        class="border-b border-black-600 flex items-center justify-center text-xs text-back-400 cursor-pointer"
        :class="{
          'bg-red-300': isSelected(day.fullDate, hour),
          'text-back-400 hover:bg-blue-50': !isSelected(day.fullDate, hour),
        }"
        @mousedown="$emit('selectStart', day.fullDate, hour)"
        @mouseover="$emit('selectExtend', day.fullDate, hour)"
        @mouseup="$emit('selectEnd')"
      ></div>

      <!-- Slots -->
      <AgendaSlot
        v-for="slot in slots"
        :key="slot.id + '-' + slot.start"
        :slot="slot"
        :is-admin="isAdmin"
        :slot-style="slotStyle"
        :format-hour="formatHour"
        @edit="$emit('slotEdit', $event)"
        @remove="$emit('slotRemove', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Slot } from "../../services/slots";
import AgendaSlot from "./AgendaSlot.vue";

defineProps<{
  day: { name: string; date: string; fullDate: string };
  slots: Slot[];
  isAdmin: boolean;
  isSelected: (date: string, hour: string) => boolean;
  slotStyle: (slot: Slot) => Record<string, string>;
  formatHour: (dateString: string) => string;
}>();

defineEmits<{
  (e: "selectStart", date: string, hour: string): void;
  (e: "selectExtend", date: string, hour: string): void;
  (e: "selectEnd"): void;
  (e: "slotEdit", slot: Slot): void;
  (e: "slotRemove", id: number): void;
}>();

const hours = [
  ...Array.from(
    { length: 17 },
    (_, i) => `${String(i + 7).padStart(2, "0")}:00`
  ),
];
</script>
