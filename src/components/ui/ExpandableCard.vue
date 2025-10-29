<template>
  <section :class="cardClasses">
    <header
      role="button"
      :aria-expanded="expanded"
      :aria-controls="contentId"
      tabindex="0"
      :class="[
        'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between select-none',
        isCollapsible ? 'cursor-pointer' : 'cursor-default'
      ]"
      @click="handleHeaderClick"
      @keydown.enter.prevent="handleHeaderClick"
      @keydown.space.prevent="handleHeaderClick"
    >
      <div class="flex-1">
        <slot
          name="header"
          :expanded="expanded"
          :toggle="toggle"
          :open="open"
          :close="close"
        />
      </div>

      <div v-if="isCollapsible" class="flex items-center justify-end sm:justify-center">
        <slot name="indicator" :expanded="expanded">
          <svg
            class="h-5 w-5 text-gray-500 transition-transform duration-300"
            :class="{ 'rotate-180': expanded }"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z"
              clip-rule="evenodd"
            />
          </svg>
        </slot>
      </div>
    </header>

    <ExpandCollapse :visible="expanded">
      <div :id="contentId" class="mt-4">
        <slot />
      </div>
    </ExpandCollapse>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import ExpandCollapse from "./ExpandCollapse.vue";

interface Props {
  expanded?: boolean;
  collapsible?: boolean;
  shadow?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  collapsible: true,
  shadow: true,
});

const emit = defineEmits<{ (e: "update:expanded", value: boolean): void }>();

const contentId = `expandable-card-${Math.random().toString(36).slice(2, 9)}`;

const internalExpanded = ref(props.expanded ?? false);
const isControlled = computed(() => props.expanded !== undefined);

watch(
  () => props.expanded,
  (value) => {
    if (isControlled.value) {
      internalExpanded.value = value ?? false;
    }
  }
);

const expanded = computed({
  get: () => (isControlled.value ? props.expanded ?? false : internalExpanded.value),
  set: (value: boolean) => {
    if (!value && props.collapsible === false) {
      if (!isControlled.value) {
        internalExpanded.value = true;
      }
      emit("update:expanded", true);
      return;
    }

    if (!isControlled.value) {
      internalExpanded.value = value;
    }

    emit("update:expanded", value);
  },
});

const isCollapsible = computed(() => props.collapsible !== false);

function open() {
  expanded.value = true;
}

function close() {
  if (props.collapsible === false) return;
  expanded.value = false;
}

function toggle() {
  expanded.value = !expanded.value;
}

function handleHeaderClick() {
  if (!expanded.value) {
    open();
    return;
  }

  if (props.collapsible !== false) {
    close();
  }
}

const cardClasses = computed(() => [
  "border border-black rounded-xl bg-white transition-all duration-300",
  props.shadow !== false ? "shadow-sm" : "shadow-none",
]);
</script>
