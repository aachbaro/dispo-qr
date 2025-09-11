<template>
  <div>
    <div
      class="flex items-center justify-end gap-4 p-4 bg-white shadow rounded-md"
    >
      <!-- Loupe -->
      <button class="p-2 rounded-full hover:bg-gray-100 transition">
        <svg
          class="w-5 h-5 text-gray-600"
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

      <!-- Flèches -->
      <div class="flex gap-2">
        <button
          class="p-2 rounded-full hover:bg-gray-100 transition disabled:opacity-30 disabled:cursor-not-allowed"
          @click="semainePrecedente"
          :disabled="estSemaineCourante"
        >
          <svg
            class="w-5 h-5 text-gray-600"
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
          class="p-2 rounded-full hover:bg-gray-100 transition"
          @click="semaineSuivante"
        >
          <svg
            class="w-5 h-5 text-gray-600"
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
  <!-- Chaque jour (colonne) -->
  <div class="flex w-full h-full overflow-x-auto snap-x snap-mandatory">
    <!-- Colonnes jours -->
    <div
      v-for="(jour, index) in jours"
      :key="index"
      class="w-[calc(100%/7)] h-full flex-shrink-0 snap-center border-r border-gray-200 flex flex-col"
    >
      <!-- En-tête jour -->
      <div
        class="h-12 flex flex-col items-center justify-center bg-gray-100 border-b shrink-0"
      >
        <span class="text-sm font-medium">{{ jour.nom }}</span>
        <span class="text-xs text-gray-500">{{ jour.date }}</span>
      </div>

      <!-- Lignes horaires -->
      <div class="flex-1 grid grid-rows-21 relative">
        <!-- cases horaires -->
        <div
          v-for="(heure, hIndex) in heures"
          :key="hIndex"
          class="border-b flex items-center justify-center text-xs text-gray-400 cursor-pointer"
          :class="{
            'bg-red-300 ': isSelected(jour.fullDate, heure),
            'text-gray-400 hover:bg-blue-50': !isSelected(jour.fullDate, heure),
          }"
          @mousedown="startSelection(jour.fullDate, heure)"
          @mouseover="extendSelection(jour.fullDate, heure)"
          @mouseup="endSelection"
        >
          {{ heure }}
        </div>

        <!-- Slots venant de la DB -->
        <div
          v-for="slot in daySlots(jour.fullDate)"
          :key="slot.id"
          class="absolute left-1 right-1 bg-red-500 text-white rounded p-1 text-xs shadow flex flex-col"
          :style="slotStyle(slot)"
        >
          <div class="flex justify-between items-center">
            <span class="font-semibold">{{ slot.title }}</span>
            <div v-if="isAdmin" class="flex gap-1">
              <button @click="editSlot(slot)" class="hover:text-yellow-300">
                ✏️
              </button>
              <button @click="removeSlot(slot.id)" class="hover:text-gray-300">
                ❌
              </button>
            </div>
          </div>
          <span class="text-[10px]">
            {{ formatHour(slot.start) }} - {{ formatHour(slot.end) }}
          </span>
        </div>
      </div>
    </div>
    <!-- ✅ Popup -->
    <SelectionPopup
      v-if="currentSelection"
      v-model:open="showPopup"
      :initial-date="currentSelection.date"
      :initial-start="currentSelection.start"
      :initial-end="currentSelection.end"
      @confirm="handleConfirm"
      @cancel="handleCancel"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import SelectionPopup from "./SelectionPopup.vue";
import { getSlots, deleteSlot } from "../services/api";

const isDragging = ref(false);
const selectionStart = ref(null);
const selectionEnd = ref(null);
const selectedSlots = ref([]);

// admin check
const isAdmin = ref(!!localStorage.getItem("adminToken"));

// popup control
const showPopup = ref(false);
const currentSelection = ref(null);

const slots = ref([]);

onMounted(async () => {
  try {
    const { slots: data } = await getSlots();
    slots.value = data;
  } catch (err) {
    console.error("Erreur récupération slots:", err);
  }
});

// Obtenir le lundi de la semaine actuelle
function getLundi(date = new Date()) {
  const d = new Date(date);
  const jour = d.getDay();
  const diff = d.getDate() - (jour === 0 ? 6 : jour - 1); // 0 = dimanche
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

const semaineCourante = getLundi();
const semaineActive = ref(new Date(semaineCourante)); // Date modifiable par les flèches

const jours = computed(() => {
  const lundi = new Date(semaineActive.value);
  const noms = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lundi.getTime());
    d.setDate(d.getDate() + i);
    return {
      nom: noms[i],
      date: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
      fullDate: d.toLocaleDateString("fr-CA"),
    };
  });
});

function semaineSuivante() {
  semaineActive.value.setDate(semaineActive.value.getDate() + 7);
  semaineActive.value = new Date(semaineActive.value);
}

function semainePrecedente() {
  const nouvelleDate = new Date(semaineActive.value);
  nouvelleDate.setDate(nouvelleDate.getDate() - 7);

  // Ne pas aller avant la semaine actuelle
  if (nouvelleDate < semaineCourante) return;

  semaineActive.value = nouvelleDate;
}

const estSemaineCourante = computed(() => {
  return semaineActive.value.getTime() === semaineCourante.getTime();
});

const heures = [
  ...Array.from(
    { length: 17 },
    (_, i) => `${String(i + 7).padStart(2, "0")}:00`
  ),
];

function startSelection(date, heure) {
  isDragging.value = true;
  selectionStart.value = { date, heure };
  selectionEnd.value = { date, heure };
}

function extendSelection(date, heure) {
  if (isDragging.value && selectionStart.value?.date === date) {
    selectionEnd.value = { date, heure };
  }
}

function endSelection() {
  if (isDragging.value && selectionStart.value && selectionEnd.value) {
    const slots = buildSelectionRange(selectionStart.value, selectionEnd.value);
    const startHour = slots[0].heure;
    const endHour = slots[slots.length - 1].heure;
    const date = selectionStart.value.date;

    if (isAdmin.value) {
      // 👉 ouvrir popup avec la sélection
      currentSelection.value = { date, start: startHour, end: endHour };
      showPopup.value = true;
    } else {
      console.log(`📅 Sélection faite : ${date} de ${startHour} à ${endHour}`);
      selectedSlots.value.push({ date, start: startHour, end: endHour });
    }
  }

  isDragging.value = false;
  selectionStart.value = null;
  selectionEnd.value = null;
}

// handlers du popup
function handleConfirm(payload) {
  console.log("✅ Confirmé :", payload);
  selectedSlots.value.push(payload);
  showPopup.value = false;
}

function handleCancel() {
  console.log("❌ Annulé");
  showPopup.value = false;
}

function buildSelectionRange(start, end) {
  const heuresList = [
    ...Array.from(
      { length: 17 },
      (_, i) => `${String(i + 7).padStart(2, "0")}:00`
    ),
    "00:00",
    "01:00",
    "02:00",
  ];
  const startIndex = heuresList.indexOf(start.heure);
  const endIndex = heuresList.indexOf(end.heure);
  const [min, max] = [
    Math.min(startIndex, endIndex),
    Math.max(startIndex, endIndex),
  ];

  return heuresList.slice(min, max + 1).map((h) => ({
    date: start.date,
    heure: h,
  }));
}

function isSelected(date, heure) {
  // pendant le drag : highlight provisoire
  if (isDragging.value && selectionStart.value?.date === date) {
    const tempSlots = buildSelectionRange(
      selectionStart.value,
      selectionEnd.value || selectionStart.value
    );
    return tempSlots.some((s) => s.date === date && s.heure === heure);
  }
  // après validation
  return selectedSlots.value.some((s) => s.date === date && s.heure === heure);
}

function daySlots(date) {
  return slots.value.filter((s) => s.start.split("T")[0] === date);
}

function slotStyle(slot) {
  const start = new Date(slot.start);
  const end = new Date(slot.end);

  const startHour = start.getHours() + start.getMinutes() / 60;
  const endHour = end.getHours() + end.getMinutes() / 60;

  // agenda va de 07:00 à 24:00 → soit 17h
  const totalHours = 17;
  const hourHeight = 100 / totalHours;

  return {
    top: `${(startHour - 7) * hourHeight}%`,
    height: `${(endHour - startHour) * hourHeight}%`,
  };
}

function formatHour(dateString) {
  return new Date(dateString).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function removeSlot(id) {
  try {
    await deleteSlot(id);
    slots.value = slots.value.filter((s) => s.id !== id);
  } catch (err) {
    console.error("Erreur suppression slot:", err);
  }
}

function editSlot(slot) {
  // TODO: ouvrir SelectionPopup pré-rempli avec slot
  console.log("Éditer slot:", slot);
}
</script>
