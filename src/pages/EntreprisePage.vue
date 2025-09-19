<template>
  <div class="max-w-3xl mx-auto p-6 space-y-6">
    <h1 class="text-2xl font-bold">
      {{ entreprise?.nom }} {{ entreprise?.prenom }}
    </h1>
    <p class="text-gray-600">Agenda et missions de l’entreprise</p>

    <div v-if="loading" class="text-gray-500">Chargement...</div>
    <div v-else-if="!entreprise" class="text-red-600">
      Entreprise introuvable
    </div>

    <div v-else>
      <!-- Infos -->
      <div class="p-4 border rounded bg-white shadow">
        <p><b>Email :</b> {{ entreprise.email }}</p>
        <p><b>Téléphone :</b> {{ entreprise.telephone || "—" }}</p>
        <p><b>Adresse :</b> {{ entreprise.adresse || "—" }}</p>
      </div>

      <!-- Agenda (placeholder) -->
      <div class="p-4 border rounded bg-white shadow">
        <h2 class="text-lg font-semibold mb-2">Agenda</h2>
        <p>👉 Ici on affichera les slots de l’entreprise</p>
      </div>

      <!-- Missions (placeholder) -->
      <div class="p-4 border rounded bg-white shadow">
        <h2 class="text-lg font-semibold mb-2">Missions</h2>
        <p>👉 Ici on affichera les missions liées à l’entreprise</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { getEntrepriseBySlug } from "../services/entreprises";

const route = useRoute();
const entreprise = ref(null);
const loading = ref(true);

onMounted(async () => {
  try {
    const { data } = await getEntrepriseBySlug(route.params.slug);
    entreprise.value = data;
  } catch (err) {
    console.error("❌ Erreur chargement entreprise :", err);
  } finally {
    loading.value = false;
  }
});
</script>
