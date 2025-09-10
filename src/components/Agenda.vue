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
      <div class="flex-1 grid grid-rows-21">
        <div
          v-for="(heure, hIndex) in heures"
          :key="hIndex"
          class="border-b flex items-center justify-center text-xs text-gray-400"
          @click="onCaseClick(jour, heure)"
        >
          {{ heure }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

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
  "00:00",
  "01:00",
  "02:00",
];

function onCaseClick(jour, heure) {
  const selection = {
    date: jour.fullDate,
    heure,
  };
  console.log("⏰ Case cliquée :", selection);
  // Tu peux aussi push dans un array si tu veux enregistrer plusieurs clics
}
</script>
