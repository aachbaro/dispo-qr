<!-- src/pages/ClientPage.vue -->
<!-- -------------------------------------------------------------
 Page Client
---------------------------------------------------------------
📌 Description :
 - Espace personnel pour un utilisateur de type "client"
 - Contient :
   • Infos basiques
   • Gestion des modèles de mission (TemplateList)
   • Gestion des contacts (ContactList)
   • Liste de missions (placeholder)
   • Agenda (placeholder)

🔒 Règles d’accès :
 - Accessible uniquement aux utilisateurs avec role = client
--------------------------------------------------------------- -->

<template>
  <div class="max-w-5xl mx-auto p-6 space-y-12">
    <!-- Infos -->
    <section>
      <h2 class="text-xl font-bold mb-2">📋 Mes informations</h2>
      <div class="p-4 border rounded bg-gray-50">
        <p>Email : {{ user?.email }}</p>
        <p>Role : {{ user?.role }}</p>
      </div>
    </section>

    <!-- Modèles de mission -->
    <section>
      <h2 class="text-xl font-bold mb-4">📑 Mes modèles de mission</h2>
      <TemplateList />
    </section>

    <!-- Contacts -->
    <section>
      <h2 class="text-xl font-bold mb-4">📇 Mes contacts</h2>
      <ContactList />
    </section>

    <!-- Missions -->
    <section>
      <h2 class="text-xl font-bold mb-2">📂 Mes missions</h2>
      <div v-if="loadingMissions" class="text-gray-500">Chargement...</div>
      <div v-else-if="missions.length === 0" class="text-gray-500">
        Aucune mission pour le moment.
      </div>
      <div v-else class="grid gap-4">
        <MissionCard
          v-for="mission in missions"
          :key="mission.id"
          :mission="mission"
          :slug="mission.entreprise_slug"
          readonly
        />
      </div>
    </section>

    <!-- Agenda -->
    <section>
      <h2 class="text-xl font-bold mb-2">📅 Mon agenda</h2>
      <div class="p-4 border rounded bg-gray-50">
        <p class="text-gray-500">Agenda en cours de développement…</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from "../composables/useAuth";
import TemplateList from "../components/TemplateList.vue";
import ContactList from "../components/ContactList.vue";

const { user } = useAuth();
</script>
