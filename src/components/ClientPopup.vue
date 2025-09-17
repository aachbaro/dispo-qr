<!-- src/components/ClientPopup.vue -->
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
          <h2 class="text-lg font-semibold">Demander une mission</h2>
        </div>

        <!-- Body -->
        <div class="px-5 py-4 space-y-4">
          <!-- Établissement -->
          <div class="space-y-1">
            <label class="text-sm font-medium">Établissement</label>
            <input
              v-model="etablissement"
              type="text"
              required
              placeholder="Nom de l'établissement"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Contact -->
          <div class="space-y-1">
            <label class="text-sm font-medium">Contact</label>
            <input
              v-model="contact"
              type="text"
              required
              placeholder="ex: client@email.com"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Instructions -->
          <div class="space-y-1">
            <label class="text-sm font-medium">Instructions</label>
            <textarea
              v-model="instructions"
              rows="3"
              placeholder="Précisions sur la mission..."
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          <!-- Mode -->
          <div class="space-y-1">
            <label class="text-sm font-medium">Mode</label>
            <select
              v-model="mode"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="freelance">Freelance (auto-entrepreneur)</option>
              <option value="salarié">Salarié (contrat d'extra)</option>
            </select>
          </div>

          <!-- Dates -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-sm font-medium">Date début</label>
              <input
                type="date"
                v-model="startDate"
                :min="minDate"
                @wheel.prevent="onScrollDate($event, 'startDate')"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="text-sm font-medium">Date fin</label>
              <input
                type="date"
                v-model="endDate"
                :min="minDate"
                @wheel.prevent="onScrollDate($event, 'endDate')"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <!-- Heures -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-sm font-medium">Heure début</label>
              <input
                type="time"
                v-model="startTime"
                step="900"
                @wheel.prevent="onScrollTime($event, 'startTime')"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label class="text-sm font-medium">Heure fin</label>
              <input
                type="time"
                v-model="endTime"
                step="900"
                @wheel.prevent="onScrollTime($event, 'endTime')"
                class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <p v-if="isInvalid" class="text-sm text-red-600">
            L'heure de début doit être antérieure à l'heure de fin.
          </p>
        </div>

        <!-- Footer -->
        <div class="px-5 py-4 border-t flex justify-end gap-2">
          <button
            type="button"
            class="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
            @click="onCancel"
          >
            Annuler
          </button>
          <button
            type="button"
            class="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            :disabled="isInvalid"
            @click="onConfirm"
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed } from "vue";
import { createMission } from "../services/missions";

// Props
const props = defineProps({
  open: Boolean,
  initialDate: String,
  initialStart: String,
  initialEnd: String,
});

const emit = defineEmits(["close", "created"]);

// Champs client
const etablissement = ref("");
const contact = ref("");
const instructions = ref("");
const mode = ref("freelance");

// Dates/heures
const startDate = ref(props.initialDate || "");
const endDate = ref(props.initialDate || "");
const startTime = ref(props.initialStart || "12:00");
const endTime = ref(props.initialEnd || "14:00");

// borne min (lundi de la semaine courante)
function getWeekStart(d = new Date()) {
  const x = new Date(d);
  const day = x.getDay(); // 0=dim, 1=lun...
  const diff = x.getDate() - (day === 0 ? 6 : day - 1); // lundi
  x.setDate(diff);
  x.setHours(0, 0, 0, 0);
  return x;
}
function toYMD(dt) {
  return dt.toISOString().slice(0, 10);
}
function parseYMD(s) {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
const minDate = toYMD(getWeekStart());

// Validation
const isInvalid = computed(() => {
  if (!startDate.value || !endDate.value || !startTime.value || !endTime.value)
    return true;
  const s = new Date(`${startDate.value}T${startTime.value}`);
  const e = new Date(`${endDate.value}T${endTime.value}`);
  return s >= e;
});

// Scroll heures (par pas de 15 min)
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

// Scroll dates (±1j ; Shift=±7j ; Alt=±30j)
function onScrollDate(event, field) {
  let step = 1;
  if (event.shiftKey) step = 7;
  if (event.altKey) step = 30;

  const dir = event.deltaY < 0 ? +1 : -1;
  const src = field === "startDate" ? startDate : endDate;

  let base = parseYMD(src.value) || new Date();
  base.setDate(base.getDate() + dir * step);

  // clamp min
  const minDt = parseYMD(minDate);
  if (base < minDt) base = minDt;

  src.value = toYMD(base);

  // Toujours endDate >= startDate
  if (endDate.value < startDate.value) endDate.value = startDate.value;
}

// Actions
function onCancel() {
  emit("close");
}

async function onConfirm() {
  if (isInvalid.value) return;

  const startISO = new Date(
    `${startDate.value}T${startTime.value}`
  ).toISOString();
  const endISO = new Date(`${endDate.value}T${endTime.value}`).toISOString();

  try {
    const { mission } = await createMission({
      etablissement: etablissement.value,
      contact: contact.value,
      instructions: instructions.value,
      mode: mode.value,
      date_slot: startISO, // ⚠️ si tu veux stocker end → ajoute end_slot dans la DB
    });

    emit("created", mission);
    emit("close");
  } catch (err) {
    console.error("Erreur création mission:", err);
    alert("❌ Erreur lors de l'envoi");
  }
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
