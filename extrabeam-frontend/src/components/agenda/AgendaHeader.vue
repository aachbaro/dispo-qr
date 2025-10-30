<!-- src/components/agenda/AgendaHeader.vue -->
<template>
  <div class="flex items-center justify-between gap-4 p-4 bg-white border-none">
    <!-- Add Slot Button -->
    <div class="flex items-center">
      <button
        v-if="isAdmin"
        @click="$emit('addSlot')"
        class="p-2 rounded-full hover:bg-back-100 transition"
        aria-label="Add slot"
      >
        <svg
          class="w-6 h-6 text-back-600"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>

    <!-- Week Label -->
    <h2 class="text-lg text-back-700 font-medium text-center flex-1">
      {{ weekLabel }}
    </h2>

    <div class="flex items-center gap-4">
      <!-- Date Picker -->
      <div class="relative">
        <button
          class="p-2 rounded-full hover:bg-back-100 transition"
          aria-label="search"
          @click="showDatePicker = !showDatePicker"
        >
          <svg
            class="w-5 h-5 text-back-600"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>

        <input
          v-if="showDatePicker"
          type="date"
          class="absolute top-10 right-0 border rounded p-1 bg-white"
          @change="onDatePicked"
        />
      </div>

      <!-- Navigation Arrows -->
      <div class="flex gap-2">
        <button
          class="p-2 rounded-full hover:bg-back-100 transition disabled:opacity-30 disabled:cursor-not-allowed"
          @click="$emit('prevWeek')"
          :disabled="isCurrentWeek"
          aria-label="Previous week"
        >
          <svg
            class="w-5 h-5 text-back-600"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <button
          class="p-2 rounded-full hover:bg-back-100 transition"
          @click="$emit('nextWeek')"
          aria-label="Next week"
        >
          <svg
            class="w-5 h-5 text-back-600"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

defineProps<{
  isAdmin: boolean;
  weekLabel: string;
  isCurrentWeek: boolean;
}>();

const emit = defineEmits<{
  (e: "addSlot"): void;
  (e: "prevWeek"): void;
  (e: "nextWeek"): void;
  (e: "datePicked", date: Date): void;
}>();

const showDatePicker = ref(false);

function onDatePicked(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.value) return;
  emit("datePicked", new Date(input.value));
  showDatePicker.value = false;
}
</script>
