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
          :slug="mission.entreprise_slug ?? null"
          readonly
        />
      </div>
    </section>

    <!-- Factures -->
    <section>
      <h2 class="text-xl font-bold mb-2">📑 Mes factures</h2>
      <div v-if="loadingFactures" class="text-gray-500">Chargement...</div>
      <div v-else-if="factures.length === 0" class="text-gray-500">
        Aucune facture disponible pour le moment.
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="facture in factures"
          :key="facture.id"
          class="border rounded-lg p-4 bg-white shadow-sm"
        >
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="font-semibold">Facture {{ facture.numero }}</p>
              <p class="text-sm text-gray-500">
                Émise le {{ formatDate(facture.date_emission) }}
              </p>
            </div>
            <div class="text-right">
              <p class="font-semibold">
                {{ facture.montant_ttc.toFixed(2) }} € TTC
              </p>
              <p class="text-sm text-gray-500">
                {{ getStatusLabel(facture.status) }}
              </p>
            </div>
          </div>
          <p v-if="facture.missions?.etablissement" class="text-sm text-gray-600 mt-2">
            Mission : {{ facture.missions.etablissement }}
          </p>
        </div>
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
import { ref, onMounted } from "vue";
import { useAuth } from "../composables/useAuth";
import TemplateList from "../components/TemplateList.vue";
import ContactList from "../components/ContactList.vue";
import MissionCard from "../components/missions/MissionCard.vue";
import {
  listMissions,
  type MissionWithRelations,
} from "../services/missions";
import { listFactures, type FactureWithRelations } from "../services/factures";

const { user } = useAuth();

const missions = ref<MissionWithRelations[]>([]);
const loadingMissions = ref(false);
const factures = ref<FactureWithRelations[]>([]);
const loadingFactures = ref(false);

const factureStatusLabels: Record<string, string> = {
  pending_payment: "Paiement en attente",
  paid: "Payée",
  cancelled: "Annulée",
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("fr-FR");
}

function getStatusLabel(status: string | null | undefined) {
  if (!status) return "—";
  return factureStatusLabels[status] ?? status;
}

async function fetchMissions() {
  if (user.value?.role !== "client") return;
  loadingMissions.value = true;
  try {
    const { missions: data } = await listMissions();
    missions.value = data;
  } catch (err) {
    console.error("❌ Erreur récupération missions client:", err);
  } finally {
    loadingMissions.value = false;
  }
}

async function fetchFactures() {
  if (user.value?.role !== "client") return;
  loadingFactures.value = true;
  try {
    const { factures: data } = await listFactures();
    factures.value = data;
  } catch (err) {
    console.error("❌ Erreur récupération factures client:", err);
  } finally {
    loadingFactures.value = false;
  }
}

onMounted(() => {
  if (user.value?.role === "client") {
    fetchMissions();
    fetchFactures();
  }
});
</script>
