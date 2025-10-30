<template>
  <teleport to="body">
    <transition name="modal-fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div
          class="absolute inset-0 bg-black/40"
          @click="onClose"
        ></div>
        <div
          class="relative z-10 w-full max-w-lg mx-4 bg-white rounded-xl shadow-lg"
        >
          <header
            class="flex items-center justify-between px-6 py-4 border-b border-gray-100"
          >
            <slot name="title">
              <h3 class="text-lg font-semibold text-gray-900">
                {{ title }}
              </h3>
            </slot>
            <button
              type="button"
              class="p-2 text-gray-400 hover:text-gray-700"
              @click="onClose"
            >
              <span class="sr-only">Fermer</span>
              &times;
            </button>
          </header>

          <div class="px-6 py-4 max-h-[70vh] overflow-y-auto">
            <slot />
          </div>

          <footer
            v-if="$slots.footer"
            class="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl"
          >
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, toRefs } from "vue";

const props = defineProps<{ modelValue: boolean; title?: string }>();
const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
}>();

const { modelValue, title } = toRefs(props);

function onClose() {
  emit("update:modelValue", false);
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    onClose();
  }
}

onMounted(() => {
  window.addEventListener("keydown", onKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeyDown);
});
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
