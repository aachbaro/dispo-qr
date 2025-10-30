<!-- src/components/SelectionPopup.vue -->
<!-- -------------------------------------------------------------
 Composant : SelectionPopup (création rapide de créneau)
--------------------------------------------------------------- -->

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
      >
        <!-- Header -->
        <div class="px-5 py-4 border-b">
          <h2 id="popup-title" class="text-lg font-semibold">
            Nouveau créneau
          </h2>
        </div>

        <!-- Body -->
        <div class="px-5 py-4 space-y-4">
          <!-- 🧩 Type -->
          <div class="space-y-1">
            <label class="text-sm font-medium">Type de créneau</label>
            <select
              v-model="mode"
              class="w-full rounded-full border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="slot">Créneau de travail</option>
              <option value="unavailability">Indisponibilité</option>
            </select>
          </div>

          <!-- 🏷️ Titre -->
          <div class="space-y-1">
            <label class="text-sm font-medium">Titre</label>
            <input
              v-model="title"
              type="text"
              placeholder="ex: Service du soir"
              class="w-full rounded-full border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- 📅 Dates -->
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

          <!-- 🕒 Heures -->
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

          <!-- 🔁 Récurrence -->
          <div v-if="mode === 'unavailability'" class="space-y-2">
            <label class="text-sm font-medium">Répétition</label>
            <select
              v-model="recurrenceType"
              class="w-full rounded-full border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="none">Une seule fois</option>
              <option value="daily">Chaque jour</option>
              <option value="weekly">Chaque semaine</option>
              <option value="monthly">Chaque mois</option>
            </select>

            <!-- 🗓️ Affichage dynamique du jour concerné -->
            <p
              v-if="recurrenceType !== 'none'"
              class="text-sm text-gray-500 italic"
            >
              {{
                recurrenceType === "weekly"
                  ? `Chaque semaine le ${weekdayLabel}`
                  : recurrenceType === "monthly"
                  ? `Chaque mois ${dayOfMonth}`
                  : ""
              }}
            </p>

            <!-- ✅ Bouton pour activer une période -->
            <div
              v-if="recurrenceType !== 'none'"
              class="flex items-center gap-2 mt-2"
            >
              <input
                id="toggle-period"
                type="checkbox"
                v-model="useRecurrencePeriod"
                class="accent-blue-600"
              />
              <label for="toggle-period" class="text-sm select-none">
                Définir une période de début/fin
              </label>
            </div>

            <!-- 🗓️ Période de récurrence -->
            <div v-if="useRecurrencePeriod" class="space-y-1">
              <label class="text-sm font-medium">Période de récurrence</label>
              <div class="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  v-model="recurrenceStart"
                  :min="startDate"
                  class="w-full rounded-full border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="date"
                  v-model="recurrenceEnd"
                  :min="recurrenceStart || startDate"
                  class="w-full rounded-full border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <!-- ⚠️ Errors -->
          <p v-if="isInvalid" class="text-sm text-red-600">
            L'heure de début doit être avant celle de fin.
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
            Annuler
          </button>
          <button
            class="btn-primary transition disabled:opacity-50"
            :disabled="isInvalid || !title || isBeforeMinWeek || isPastStart"
            @click="onConfirm"
          >
            Valider
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from "vue";
import { createEntrepriseSlot } from "../services/slots";
import { createUnavailability } from "../services/unavailabilities";

// -------------------------------------------------------------
// Props & Emits
// -------------------------------------------------------------
const props = defineProps<{
  open: boolean;
  initialDate?: string;
  initialStart?: string;
  initialEnd?: string;
  slug: string;
}>();

const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
  (e: "created", slot: any): void;
  (e: "cancel"): void;
}>();

// -------------------------------------------------------------
// Dates helpers
// -------------------------------------------------------------
function getWeekStart(d = new Date()) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = x.getDate() - (day === 0 ? 6 : day - 1);
  x.setDate(diff);
  x.setHours(0, 0, 0, 0);
  return x;
}
function toYMD(dt: Date) {
  return dt.toISOString().split("T")[0];
}
function parseYMD(s: string | undefined) {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

const minDate = toYMD(getWeekStart());

// -------------------------------------------------------------
// Reactive state
// -------------------------------------------------------------
const mode = ref<"slot" | "unavailability">("slot");
const title = ref("");
const startDate = ref(props.initialDate ?? "");
const endDate = ref(props.initialDate ?? "");
const startTime = ref(props.initialStart ?? "12:00");
const endTime = ref(props.initialEnd ?? "14:00");
const recurrenceType = ref<"none" | "daily" | "weekly" | "monthly">("none");
const recurrenceStart = ref<string>("");
const recurrenceEnd = ref<string>("");
const useRecurrencePeriod = ref(false);
const startDateEl = ref<HTMLInputElement | null>(null);

// Labels pour affichage du jour de la semaine
const daysOfWeek = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
];

const weekdayValue = computed(() => {
  const [y, m, d] = startDate.value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCDay(); // ✅ identique au backend
});

const weekdayLabel = computed(() => daysOfWeek[weekdayValue.value]);
const dayOfMonth = computed(() => {
  const [y, m, d] = startDate.value.split("-").map(Number);
  return d ? `le ${d}` : "";
});

// -------------------------------------------------------------
// Validation
// -------------------------------------------------------------
const startDateTime = computed(
  () => new Date(`${startDate.value}T${startTime.value}`)
);
const endDateTime = computed(
  () => new Date(`${endDate.value}T${endTime.value}`)
);
const isInvalid = computed(() => startDateTime.value >= endDateTime.value);
const isBeforeMinWeek = computed(
  () => startDate.value < minDate || endDate.value < minDate
);
const isPastStart = computed(() => startDateTime.value < new Date());

// -------------------------------------------------------------
// Reset à l’ouverture
// -------------------------------------------------------------
watch(
  () => props.open,
  async (val) => {
    if (!val) return;
    title.value = "";
    mode.value = "slot";
    recurrenceType.value = "none";
    recurrenceStart.value = "";
    recurrenceEnd.value = "";
    useRecurrencePeriod.value = false;

    const init = props.initialDate || toYMD(new Date());
    const clamped = init < minDate ? minDate : init;

    startDate.value = clamped;
    endDate.value = clamped;
    startTime.value = props.initialStart ?? "12:00";
    endTime.value = props.initialEnd ?? "14:00";

    await nextTick();
    startDateEl.value?.focus();
  }
);

// -------------------------------------------------------------
// Scroll helpers
// -------------------------------------------------------------
function onScrollTime(event: WheelEvent, field: "startTime" | "endTime") {
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

function onScrollDate(event: WheelEvent, field: "startDate" | "endDate") {
  let step = 1;
  if (event.shiftKey) step = 7;
  if (event.altKey) step = 30;
  const dir = event.deltaY < 0 ? +1 : -1;
  const src = field === "startDate" ? startDate : endDate;
  let base = parseYMD(src.value) || new Date();
  base.setHours(12, 0, 0, 0);
  base.setDate(base.getDate() + dir * step);
  if (base < parseYMD(minDate)!) base = parseYMD(minDate)!;
  src.value = toYMD(base);
  if (endDate.value < startDate.value) endDate.value = startDate.value;
}

// -------------------------------------------------------------
// Actions
// -------------------------------------------------------------
function onCancel() {
  emit("cancel");
  emit("update:open", false);
}

async function onConfirm() {
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
    if (mode.value === "slot") {
      const { slot } = await createEntrepriseSlot(props.slug, {
        start: startISO,
        end: endISO,
        title: title.value,
      });
      emit("created", slot);
    } else {
      const weekday = weekdayValue.value;
      const unavailability = await createUnavailability(props.slug, {
        title: title.value,
        start_date: startDate.value,
        start_time: startTime.value,
        end_time: endTime.value,
        recurrence_type: recurrenceType.value,
        recurrence_start: useRecurrencePeriod.value
          ? recurrenceStart.value || null
          : null,
        recurrence_end: useRecurrencePeriod.value
          ? recurrenceEnd.value || null
          : null,
        weekday,
      });
      emit("created", unavailability);
    }
  } catch (err) {
    console.error("❌ Erreur création:", err);
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
