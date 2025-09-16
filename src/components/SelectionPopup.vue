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
            <input
              ref="startDateEl"
              type="date"
              v-model="startDate"
              :min="minDate"
              @wheel.prevent="onScrollDate($event, 'startDate')"
              class="w-full rounded-full border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              v-model="endDate"
              :min="minDate"
              @wheel.prevent="onScrollDate($event, 'endDate')"
              class="w-full rounded-full border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
          <p v-else-if="isBeforeMinWeek" class="text-sm text-red-600">
            Impossible de créer avant le lundi de la semaine courante ({{
              minDate
            }}).
          </p>
          <p v-else-if="isPastStart" class="text-sm text-red-600">
            Impossible de créer un créneau dans le passé.
          </p>
        </div>

        <!-- Footer -->
        <div class="px-5 py-4 border-t flex justify-end gap-2">
          <button class="btn-primary transition" @click="onCancel">
            annuler
          </button>
          <button
            class="btn-primary transition disabled:opacity-50"
            :disabled="isInvalid || !title || isBeforeMinWeek || isPastStart"
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
  initialDate: { type: String, default: "" }, // YYYY-MM-DD
  initialStart: { type: String, default: "12:00" }, // HH:mm
  initialEnd: { type: String, default: "14:00" }, // HH:mm
});

const emit = defineEmits(["update:open", "created", "cancel"]);

// ----------------- Utils dates -----------------
function getWeekStart(d = new Date()) {
  const x = new Date(d);
  const day = x.getDay(); // 0=dim..6=sam
  const diff = x.getDate() - (day === 0 ? 6 : day - 1); // -> lundi
  x.setDate(diff);
  x.setHours(0, 0, 0, 0);
  return x;
}
function toYMD(dt) {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function parseYMD(s) {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
    ? dt
    : null;
}

// Borne basse : lundi semaine courante (exposé au template pour :min)
const minDate = toYMD(getWeekStart());

// ----------------- Champs -----------------
const title = ref("");
const startDate = ref(props.initialDate);
const endDate = ref(props.initialDate);
const startTime = ref(props.initialStart);
const endTime = ref(props.initialEnd);
const startDateEl = ref(null);

// ----------------- Validations -----------------
const startDateTime = computed(
  () => new Date(`${startDate.value}T${startTime.value}`)
);
const endDateTime = computed(
  () => new Date(`${endDate.value}T${endTime.value}`)
);

const isInvalid = computed(() => {
  const s = startDateTime.value;
  const e = endDateTime.value;
  return isNaN(s) || isNaN(e) || s >= e;
});

const isBeforeMinWeek = computed(() => {
  return (
    !startDate.value ||
    !endDate.value ||
    startDate.value < minDate ||
    endDate.value < minDate
  );
});

const isPastStart = computed(() => {
  return startDateTime.value < new Date();
});

// ----------------- Reset à l'ouverture -----------------
watch(
  () => props.open,
  async (val) => {
    if (!val) return;

    title.value = "";

    // Clamp la date initiale à minDate
    const init = props.initialDate || toYMD(new Date());
    const clamped = init < minDate ? minDate : init;

    startDate.value = clamped;
    endDate.value = clamped;
    startTime.value = props.initialStart;
    endTime.value = props.initialEnd;

    await nextTick();
    startDateEl.value?.focus();
  }
);

// ----------------- Scroll heures (15 min) -----------------
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

// ----------------- Scroll dates (±1j ; Shift=±7j ; Alt=±30j) + clamp minDate -----------------
function onScrollDate(event, field) {
  if (Math.abs(event.deltaY) < 1) return;

  let step = 1;
  if (event.shiftKey) step = 7; // semaine
  if (event.altKey) step = 30; // ~mois

  const dir = event.deltaY < 0 ? +1 : -1;
  const src = field === "startDate" ? startDate : endDate;

  let base = parseYMD(src.value) || parseYMD(props.initialDate) || new Date();
  base.setHours(12, 0, 0, 0); // évite soucis DST
  base.setDate(base.getDate() + dir * step);

  // clamp min
  const minDt = parseYMD(minDate);
  if (base < minDt) base = minDt;

  src.value = toYMD(base);

  // Toujours endDate >= startDate
  if (endDate.value < startDate.value) endDate.value = startDate.value;
}

// ----------------- Actions -----------------
function onCancel() {
  emit("cancel");
  emit("update:open", false);
}

async function onConfirm() {
  // Double barrière : pas dans le passé, pas avant lundi de la semaine courante
  if (
    isInvalid.value ||
    !title.value ||
    isBeforeMinWeek.value ||
    isPastStart.value
  )
    return;

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
