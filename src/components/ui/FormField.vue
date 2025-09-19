<!-- src/components/ui/FormField.vue -->
<template>
  <div>
    <label class="text-sm font-medium mb-1 block">{{ label }}</label>
    <input
      v-bind="$attrs"
      v-model="model"
      class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ label: string }>();
const model = defineModel<string | number>();
</script>
