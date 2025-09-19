<template>
  <div
    class="absolute left-1 right-1 bg-red-800 text-white rounded p-1 text-xs shadow flex flex-col"
    :style="slotStyle(slot)"
  >
    <div class="flex justify-between items-center">
      <span class="font-semibold">{{ slot.title }}</span>
      <div v-if="isAdmin" class="flex gap-1">
        <button @click="$emit('edit', slot)" class="hover:text-yellow-300">
          ✏️
        </button>
        <button @click="$emit('remove', slot.id)" class="hover:text-back-300">
          ❌
        </button>
      </div>
    </div>
    <span class="text-[10px]">
      {{ formatHour(slot.start) }} - {{ formatHour(slot.end) }}
    </span>
  </div>
</template>

<script setup lang="ts">
import type { Slot } from "../../services/slots";
import { defineProps, defineEmits } from "vue";

defineProps<{
  slot: Slot;
  isAdmin: boolean;
  slotStyle: (slot: Slot) => Record<string, string>;
  formatHour: (dateString: string) => string;
}>();

defineEmits<{
  (e: "edit", slot: Slot): void;
  (e: "remove", id: number): void;
}>();
</script>
