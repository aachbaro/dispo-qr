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
            Nouveau créneau
          </h2>
        </div>

        <!-- Body -->
        <div class="px-5 py-4 space-y-4">
          <!-- Titre -->
          <div class="space-y-1">
            <label class="text-sm font-medium">Titre</label>
            <input
              v-model="title"
              type="text"
              placeholder="ex: Service soir"
              class="w-full rounded-full border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Dates -->
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-sm font-medium">Date début</label>
              <input
                ref="startDateEl"
                type="date"
                v-model="startDate"
                class="w-full rounded-full border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium">Date fin</label>
              <input
                type="date"
                v-model="endDate"
                class="w-full rounded-full border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <!-- Heures -->
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-sm font-medium">Heure début</label>
              <input
                type="time"
                v-model="startTime"
                step="900"
                @wheel.prevent="onScrollTime($event, 'startTime')"
                class="w-full rounded-full border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium">Heure fin</label>
              <input
                type="time"
                v-model="endTime"
                step="900"
                @wheel.prevent="onScrollTime($event, 'endTime')"
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
            :disabled="isInvalid || !title"
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
import { createSlot } from "@/services/api";

const props = defineProps({
  open: { type: Boolean, default: false },
  initialDate: { type: String, default: "" }, // format YYYY-MM-DD
  initialStart: { type: String, default: "12:00" }, // format HH:mm
  initialEnd: { type: String, default: "14:00" }, // format HH:mm
});

const emit = defineEmits(["update:open", "created", "cancel"]);

// Champs
const title = ref("");
const startDate = ref(props.initialDate);
const endDate = ref(props.initialDate);
const startTime = ref(props.initialStart);
const endTime = ref(props.initialEnd);
const startDateEl = ref(null);

// Validation
const isInvalid = computed(() => {
  const start = new Date(`${startDate.value}T${startTime.value}`);
  const end = new Date(`${endDate.value}T${endTime.value}`);
  return isNaN(start) || isNaN(end) || start >= end;
});

// Reset quand on ouvre
watch(
  () => props.open,
  async (val) => {
    if (val) {
      title.value = "";
      startDate.value = props.initialDate;
      endDate.value = props.initialDate; // par défaut, même jour
      startTime.value = props.initialStart;
      endTime.value = props.initialEnd;
      await nextTick();
      startDateEl.value?.focus();
    }
  }
);

// Scroll ↑↓ pour ajuster par pas de 15min
function onScrollTime(event, field) {
  const val = field === "startTime" ? startTime.value : endTime.value;
  const [h, m] = val.split(":").map(Number);
  let minutes = h * 60 + m;
  minutes += event.deltaY < 0 ? 15 : -15;
  if (minutes < 0) minutes = 0;
  if (minutes >= 24 * 60) minutes = 24 * 60 - 15;
  const newH = String(Math.floor(minutes / 60)).padStart(2, "0");
  const newM = String(minutes % 60).padStart(2, "0");
  const newVal = `${newH}:${newM}`;
  if (field === "startTime") startTime.value = newVal;
  else endTime.value = newVal;
}

// Actions
function onCancel() {
  emit("cancel");
  emit("update:open", false);
}

async function onConfirm() {
  if (isInvalid.value || !title.value) return;

  const startISO = new Date(
    `${startDate.value}T${startTime.value}`
  ).toISOString();
  const endISO = new Date(`${endDate.value}T${endTime.value}`).toISOString();

  try {
    const { slot } = await createSlot({
      start: startISO,
      end: endISO,
      title: title.value,
    });
    emit("created", slot);
  } catch (err) {
    console.error("Erreur création slot:", err);
  }

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
