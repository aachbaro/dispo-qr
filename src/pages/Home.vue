<!-- src/pages/Home.vue -->
<template>
  <div class="max-w-3xl mx-auto p-6 space-y-8">
    <!-- Header -->
    <h1 class="text-2xl font-bold text-center">Bienvenue sur Dispo-QR</h1>
    <p class="text-center text-gray-600">
      Consultez l’agenda d’une entreprise ou connectez-vous pour gérer le vôtre.
    </p>

    <!-- Connexion / Inscription -->
    <div class="flex justify-center gap-4">
      <button
        @click="openLogin = true"
        class="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
      >
        Se connecter
      </button>
      <button
        @click="openRegister = true"
        class="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
      >
        S’inscrire
      </button>
    </div>

    <!-- Recherche entreprise -->
    <div class="space-y-2">
      <label class="block text-sm font-medium">Rechercher une entreprise</label>
      <div class="flex gap-2">
        <input
          v-model="slug"
          type="text"
          placeholder="ex: adam, studio-rhizom"
          class="flex-1 border rounded px-3 py-2"
        />
        <button
          @click="goToEntreprise"
          class="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
        >
          Voir
        </button>
      </div>
    </div>

    <!-- Liste d’entreprises -->
    <div v-if="entreprises.length > 0" class="space-y-2">
      <h2 class="font-semibold">Entreprises disponibles</h2>
      <ul class="list-disc list-inside text-blue-600">
        <li
          v-for="e in entreprises"
          :key="e.id"
          class="cursor-pointer underline"
          @click="router.push(`/entreprise/${e.slug}`)"
        >
          {{ e.nom }} — <span class="text-gray-500 text-sm">{{ e.slug }}</span>
        </li>
      </ul>
    </div>

    <!-- Popups -->
    <LoginModal v-if="openLogin" :open="openLogin" @close="openLogin = false" />
    <RegisterModal
      v-if="openRegister"
      :open="openRegister"
      @close="openRegister = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import LoginModal from "../components/LoginModal.vue";
import RegisterModal from "../components/RegisterModal.vue";
import { listEntreprises } from "../services/entreprises";

const router = useRouter();

const slug = ref("");
const openLogin = ref(false);
const openRegister = ref(false);

const entreprises = ref([]);

function goToEntreprise() {
  if (slug.value.trim()) {
    router.push(`/entreprise/${slug.value.trim()}`);
  }
}

onMounted(async () => {
  try {
    const { entreprises: data } = await listEntreprises(); // ✅ destructuration correcte
    entreprises.value = data;
  } catch (err) {
    console.error("❌ Erreur chargement entreprises :", err);
  }
});
</script>
