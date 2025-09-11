<template>
  <Transition name="fade">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      @keydown.esc.prevent="onCancel"
    >
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/50" @click="onCancel" />

      <!-- Modal -->
      <div
        class="relative w-full max-w-md rounded-lg bg-white shadow-lg ring-1 ring-black/5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="popup-title"
      >
        <!-- Header -->
        <div class="px-5 py-4 border-b">
          <h2 id="popup-title" class="text-lg font-semibold">
            Confirmer le créneau
          </h2>
        </div>

        <!-- Body -->
        <div class="px-5 py-4 space-y-4">
          <div class="space-y-1">
            <label class="text-sm font-medium">Date</label>
            <input
              ref="dateEl"
              type="date"
              v-model="date"
              class="w-full rounded-full border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-sm font-medium">Début</label>
              <input
                type="time"
                v-model="start"
                step="900"
                class="w-full rounded-full border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium">Fin</label>
              <input
                type="time"
                v-model="end"
                step="900"
                class="w-full rounded-full border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <p v-if="isInvalid" class="text-sm text-red-600">
            L'heure de début doit être antérieure à l'heure de fin.
          </p>
        </div>

        <!-- Footer -->
        <div class="px-5 py-4 border-t flex justify-end gap-2">
          <button class="btn-primary transition" @click="onCancel">
            annuler
          </button>
          <button
            class="btn-primary transition disabled:opacity-50"
            :disabled="isInvalid"
            @click="onConfirm"
          >
            valider
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, computed, nextTick } from "vue";

const props = defineProps({
  open: { type: Boolean, default: false }, // pour v-model:open
  initialDate: { type: String, required: true }, // format 'YYYY-MM-DD'
  initialStart: { type: String, required: true }, // format 'HH:mm'
  initialEnd: { type: String, required: true }, // format 'HH:mm'
});

const emit = defineEmits(["update:open", "confirm", "cancel"]);

const date = ref(props.initialDate);
const start = ref(props.initialStart);
const end = ref(props.initialEnd);

const dateEl = ref(null);

function resetFromProps() {
  date.value = props.initialDate;
  start.value = props.initialStart;
  end.value = props.initialEnd;
}

// focus + reset quand on ouvre
watch(
  () => props.open,
  async (val) => {
    if (val) {
      resetFromProps();
      await nextTick();
      dateEl.value?.focus();
    }
  }
);

// si les props changent (ex: autre sélection), refléter
watch(
  () => [props.initialDate, props.initialStart, props.initialEnd],
  resetFromProps
);

const isInvalid = computed(() => {
  // Comparaison lexicographique OK pour format HH:mm (ne gère pas les plages qui traversent minuit)
  return start.value >= end.value;
});

function onCancel() {
  emit("cancel");
  emit("update:open", false);
}

function onConfirm() {
  if (isInvalid.value) return;
  emit("confirm", { date: date.value, start: start.value, end: end.value });
  emit("update:open", false);
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
