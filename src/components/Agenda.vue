<template>
  <!-- Barre d'actions -->
  <div class="flex items-center justify-between gap-4 p-4 bg-white border-none">
    <!-- Bouton + -->
    <div class="flex items-center">
      <button
        v-if="isAdmin"
        @click="addSlot"
        class="p-2 rounded-full hover:bg-gray-100 transition"
        aria-label="Ajouter un slot"
      >
        <svg
          class="w-6 h-6 text-gray-600"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>

    <!-- Indicateur de semaine (centré) -->
    <h2 class="text-lg text-gray-700 font-medium text-center flex-1">
      {{ semaineLabel }}
    </h2>

    <div class="flex items-center gap-4">
      <!-- Loupe -->
      <button
        class="p-2 rounded-full hover:bg-gray-100 transition"
        aria-label="search"
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
          aria-label="Semaine précédente"
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
          aria-label="Semaine suivante"
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
    <!-- Colonne heures -->
    <div
      class="w-14 flex-shrink-0 flex flex-col border-r border-gray-200 text-xs text-gray-500"
    >
      <div class="h-12"></div>
      <!-- espace pour l’entête -->
      <div
        v-for="(heure, hIndex) in heures"
        :key="'hour-' + hIndex"
        class="flex-1 flex items-start justify-end pr-1"
      >
        {{ heure }}
      </div>
    </div>
    <!-- Colonnes jours -->
    <div
      v-for="(jour, index) in jours"
      :key="index"
      class="flex-1 h-full flex-shrink-0 snap-center border-r border-gray-200 flex flex-col"
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
        ></div>

        <!-- Slots venant de la DB -->
        <div
          v-for="slot in daySlots(jour.fullDate)"
          :key="slot.id + '-' + slot.start"
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
      @created="handleSlotCreated"
      @cancel="handleCancel"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import SelectionPopup from "./SelectionPopup.vue";
import { getSlots, deleteSlot } from "../services/api";
import useAdmin from "../composables/useAdmin";

const isDragging = ref(false);
const selectionStart = ref(null);
const selectionEnd = ref(null);
const selectedSlots = ref([]);

// admin check
// const isAdmin = ref(!!localStorage.getItem("adminToken"));
const { isAdmin } = useAdmin();

// popup control
const showPopup = ref(false);
const currentSelection = ref(null);

const slots = ref([]);
const loadingSlots = ref(false);

const semaineCourante = getLundi();
const semaineActive = ref(new Date(semaineCourante)); // Date modifiable par les flèches

onMounted(async () => {
  try {
    fetchCurrentWeek();
  } catch (err) {
    console.error("Erreur récupération slots:", err);
  }
});

watch(semaineActive, fetchCurrentWeek);

// Obtenir le lundi de la semaine actuelle
function getLundi(date = new Date()) {
  const d = new Date(date);
  const jour = d.getDay();
  const diff = d.getDate() - (jour === 0 ? 6 : jour - 1); // 0 = dimanche
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

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

// util simple pour cloner une date
function clone(d) {
  return new Date(d.getTime());
}

// format JJ/MM
function fmtJJMM(d) {
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

// début et fin de semaine basée sur semaineActive (qui est déjà un lundi)
const semaineLabel = computed(() => {
  const start = clone(semaineActive.value); // lundi
  const end = clone(semaineActive.value);
  end.setDate(end.getDate() + 6); // dimanche
  return `${fmtJJMM(start)} - ${fmtJJMM(end)}`;
});

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
  const all = [];
  for (const s of slots.value) {
    all.push(...splitSlotByDay(s));
  }
  return all.filter((p) => p.day === date);
}

function slotStyle(slot) {
  const start = new Date(slot.start);
  const end = new Date(slot.end);

  // Ancre du jour affiché : de 07:00 à 24:00
  const dayStart = new Date(start);
  dayStart.setHours(7, 0, 0, 0);
  const dayEnd = new Date(start);
  dayEnd.setHours(24, 0, 0, 0);

  // On borne le segment à la fenêtre visible
  const s = new Date(Math.max(start, dayStart));
  const e = new Date(Math.min(end, dayEnd));

  const totalMin = (dayEnd - dayStart) / 60000; // 17h = 1020 min
  const topMin = Math.max(0, (s - dayStart) / 60000);
  const endMin = Math.max(0, (e - dayStart) / 60000);
  const heightMin = Math.max(0, endMin - topMin);

  // Si le segment ne recouvre rien dans la fenêtre, on ne l'affiche pas
  if (heightMin <= 0) {
    return { display: "none" };
  }

  const topPct = (topMin / totalMin) * 100;
  const heightPct = (heightMin / totalMin) * 100;

  return {
    top: `${topPct}%`,
    height: `${heightPct}%`,
  };
}

function formatHour(dateString) {
  return new Date(dateString).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function removeSlot(id) {
  if (!isAdmin.value) return; // 🔒
  try {
    await deleteSlot(id);
    slots.value = slots.value.filter((s) => s.id !== id);
  } catch (err) {
    console.error("Erreur suppression slot:", err);
  }
}

function editSlot(slot) {
  if (!isAdmin.value) return; // 🔒
  // TODO: ouvrir SelectionPopup pré-remplie
  console.log("Éditer slot:", slot);
}

function splitSlotByDay(slot) {
  const start = new Date(slot.start);
  const end = new Date(slot.end);

  const parts = [];
  // Curseur au début du jour (00:00) du start
  let dayCursor = new Date(start);
  dayCursor.setHours(0, 0, 0, 0);

  // On avance jour par jour jusqu'à couvrir [start, end)
  while (dayCursor < end) {
    const nextDay = new Date(dayCursor);
    nextDay.setDate(nextDay.getDate() + 1);
    nextDay.setHours(0, 0, 0, 0);

    // Segment borné au jour en cours
    const segStart = new Date(Math.max(start, dayCursor));
    const segEnd = new Date(Math.min(end, nextDay));

    // On ignore les segments vides (ex : 00:00 → 00:00)
    if (segEnd > segStart) {
      parts.push({
        ...slot,
        start: toLocalIso(segStart),
        end: toLocalIso(segEnd),
        day: ymdLocal(segStart), // jour de rendu
      });
    }

    dayCursor = nextDay;
  }

  return parts;
}

function addSlot() {
  if (!isAdmin.value) return; // 🔒
  const today = new Date();
  const date = today.toLocaleDateString("fr-CA");
  const currentHour = today.getHours();
  const start = `${String(currentHour).padStart(2, "0")}:00`;
  const end = `${String(currentHour + 1).padStart(2, "0")}:00`;
  currentSelection.value = { date, start, end };
  showPopup.value = true;
}

function toLocalIso(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  // Pas de "Z" → interprété en heure locale
  return `${y}-${m}-${da}T${hh}:${mm}:${ss}`;
}

function ymdLocal(d) {
  // "fr-CA" donne YYYY-MM-DD en local
  return d.toLocaleDateString("fr-CA");
}

function handleSlotCreated(slot) {
  // Injection immédiate dans la source de vérité
  // (assure un nouveau rendu sans recharger)
  slots.value.push(slot);

  // Optionnel : refermer le popup si besoin
  showPopup.value = false;
  currentSelection.value = null;
}

// -------------------------------------
// Helpers semaine → bornes [from, to)
function weekBounds(lundiLikeDate) {
  const start = new Date(lundiLikeDate);
  start.setHours(0, 0, 0, 0); // lundi 00:00 local
  const to = new Date(start);
  to.setDate(to.getDate() + 7); // lundi suivant 00:00
  return { from: start.toISOString(), to: to.toISOString() };
}
// -------------------------------------

async function fetchCurrentWeek() {
  loadingSlots.value = true;
  try {
    const { from, to } = weekBounds(semaineActive.value);
    // get slots est au taquet lent ici --v
    const { slots: data } = await getSlots({ from, to });

    slots.value = data;
  } catch (err) {
    console.error("Erreur récupération slots:", err);
  } finally {
    loadingSlots.value = false;
  }
}
</script>
