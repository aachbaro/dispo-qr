<!-- src/components/EntrepriseSearch.vue -->
<!-- -------------------------------------------------------------
 Composant de recherche et liste d’entreprises
---------------------------------------------------------------
📌 Description :
 - Affiche une barre de recherche + la liste des entreprises publiques
 - Permet de cliquer sur une entreprise pour accéder à sa page (slug)

🔒 Règles d’accès :
 - Public (aucune auth requise)

⚠️ Remarques :
 - Utilise le service listEntreprises() pour charger la liste
 - Filtrage côté front sur le nom / slug
--------------------------------------------------------------- -->

<template>
  <div class="space-y-4">
    <!-- Recherche -->
    <div>
      <label class="block text-sm font-medium mb-1"
        >🔍 Rechercher une entreprise</label
      >
      <input
        v-model="query"
        type="text"
        placeholder="ex: studio-rhizom"
        class="w-full border rounded px-3 py-2"
      />
    </div>

    <!-- Liste -->
    <div v-if="filtered.length > 0" class="space-y-2">
      <h2 class="font-semibold">Entreprises disponibles</h2>
      <ul class="divide-y divide-gray-200 border rounded">
        <li
          v-for="e in filtered"
          :key="e.id"
          class="px-3 py-2 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
          @click="goToEntreprise(e.slug)"
        >
          <span class="text-gray-800 font-medium">{{ e.nom }}</span>
          <span class="text-sm text-gray-500">/{{ e.slug }}</span>
        </li>
      </ul>
    </div>

    <!-- Si aucune -->
    <p v-else class="text-gray-500 text-sm">Aucune entreprise trouvée…</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { listEntreprises, type Entreprise } from "../services/entreprises";

const router = useRouter();
const entreprises = ref<Entreprise[]>([]);
const query = ref("");

// Aller vers la page entreprise
function goToEntreprise(slug: string | null) {
  if (!slug) return;
  router.push(`/entreprise/${slug}`);
}

// Charger la liste au montage
onMounted(async () => {
  try {
    const { entreprises: data } = await listEntreprises();
    entreprises.value = data;
  } catch (err) {
    console.error("❌ Erreur chargement entreprises :", err);
  }
});

// Filtrage par nom ou slug
const filtered = computed(() => {
  if (!query.value.trim()) return entreprises.value;
  return entreprises.value.filter(
    (e) =>
      e.nom.toLowerCase().includes(query.value.toLowerCase()) ||
      (e.slug ?? "").toLowerCase().includes(query.value.toLowerCase())
  );
});
</script>
