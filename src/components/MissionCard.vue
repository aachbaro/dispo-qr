<!-- src/components/MissionCard.vue -->
<!-- -------------------------------------------------------------
 Carte d’une mission (MissionCard)
 ---------------------------------------------------------------
 📌 Description :
 - Affiche les détails d’une mission (contact, créneau, statut)
 - Permet d’accepter/refuser/mettre à jour le statut
 - Gère l’ouverture du FactureModal pour générer une facture

 🔒 Règles d’accès :
 - Affichage public si mission transmise
 - Actions réservées à l’owner entreprise

 ⚠️ Remarques :
 - Charge l’entreprise via son slug pour alimenter FactureModal
 - Passe l’entreprise complète en prop au modal
 ------------------------------------------------------------- -->

<template>
  <div class="border rounded-lg p-4 space-y-2">
    <!-- Infos principales -->
    <div class="flex justify-between items-center">
      <h3 class="font-bold text-lg">{{ mission.etablissement }}</h3>
      <span class="px-2 py-1 text-xs rounded-full" :class="statusClass">
        {{ mission.status }}
      </span>
    </div>

    <!-- Adresse établissement -->
    <div
      v-if="mission.etablissement_adresse_ligne1 || mission.ville"
      class="text-sm text-back-600"
    >
      📍
      {{ mission.etablissement_adresse_ligne1 || "" }}
      <span v-if="mission.etablissement_adresse_ligne2">
        , {{ mission.etablissement_adresse_ligne2 }}
      </span>
      <br />
      {{ mission.code_postal || "" }} {{ mission.ville || "" }}
      <span v-if="mission.pays">({{ mission.pays }})</span>
    </div>

    <!-- Contact -->
    <p v-if="mission.contact_name" class="text-sm font-medium">
      👤 {{ mission.contact_name }}
    </p>
    <p v-if="mission.contact_phone" class="text-sm">
      📞
      <a
        :href="`tel:${mission.contact_phone.replace(/\s+/g, '')}`"
        class="text-blue-600 underline"
      >
        {{ mission.contact_phone }}
      </a>
    </p>
    <p v-if="mission.contact_email" class="text-sm">
      ✉️
      <a
        :href="`mailto:${mission.contact_email}`"
        class="text-blue-600 underline"
      >
        {{ mission.contact_email }}
      </a>
    </p>

    <!-- Créneau -->
    <p class="text-sm text-back-600">
      📅 {{ formatDate(mission.date_slot) }} →
      {{ formatDate(mission.end_slot) }}
    </p>

    <!-- Instructions -->
    <p v-if="mission.instructions" class="text-sm italic text-back-700">
      {{ mission.instructions }}
    </p>

    <!-- Mode -->
    <p class="text-sm">
      Mode : <b>{{ mission.mode }}</b>
    </p>

    <!-- Actions -->
    <div class="flex gap-2 mt-3 justify-end">
      <!-- Proposé -->
      <template v-if="mission.status === 'proposé'">
        <button
          class="btn-primary hover:bg-blue-700"
          @click="acceptMission"
          :disabled="loading"
        >
          Accepter
        </button>
        <button
          class="btn-primary hover:bg-red-700"
          @click="rejectMission"
          :disabled="loading"
        >
          Refuser
        </button>
      </template>

      <!-- Validé -->
      <template v-else-if="mission.status === 'validé'">
        <button class="btn-primary hover:bg-green-700" @click="createDevis">
          Créer devis
        </button>
        <button class="btn-primary hover:bg-back-700" @click="markRealized">
          Marquer réalisée
        </button>
      </template>

      <!-- Réalisé -->
      <template v-else-if="mission.status === 'réalisé'">
        <button class="btn-primary hover:bg-green-700" @click="createFacture">
          Créer facture
        </button>
        <button
          class="btn-primary hover:bg-purple-700"
          @click="sendPaymentLink"
        >
          Envoyer lien de paiement
        </button>
      </template>

      <!-- Paiement en attente -->
      <template v-else-if="mission.status === 'paiement_en_attente'">
        <span class="text-sm text-yellow-600">Paiement en attente…</span>
        <button class="btn-primary hover:bg-green-700" @click="markPaid">
          Marquer payé
        </button>
      </template>

      <!-- Payé -->
      <template v-else-if="mission.status === 'payé'">
        <span class="text-sm text-green-600">Mission payée ✅</span>
        <button class="btn-primary hover:bg-back-700" @click="closeMission">
          Clore
        </button>
      </template>

      <!-- Refusé -->
      <template v-else-if="mission.status === 'refusé'">
        <span class="text-sm text-red-500">Mission refusée</span>
      </template>
    </div>
  </div>

  <!-- Facture popup -->
  <FactureModal
    v-if="showFactureModal"
    :open="showFactureModal"
    :mission="mission"
    :entreprise="entreprise || {}"
    @close="showFactureModal = false"
    @generated="handleFactureGenerated"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { updateEntrepriseMission } from "../services/missions";
import { getEntreprise } from "../services/entreprises";
import FactureModal from "./FactureModal.vue";

import type { Mission } from "../services/missions";

const props = defineProps<{
  mission: Mission;
  slug: string;
}>();

const emit = defineEmits(["updated"]);
const loading = ref(false);
const showFactureModal = ref(false);
const entreprise = ref<any>(null);

// Charger entreprise via slug
onMounted(async () => {
  try {
    const response = await getEntreprise(props.slug);
    entreprise.value = response.data || response.entreprise || response;
  } catch (err) {
    console.error("❌ Erreur récupération entreprise :", err);
  }
});

const statusClass = computed(() => {
  switch (props.mission.status) {
    case "proposé":
      return "bg-yellow-100 text-yellow-800";
    case "validé":
      return "bg-green-100 text-green-800";
    case "réalisé":
      return "bg-blue-100 text-blue-800";
    case "paiement_en_attente":
      return "bg-purple-100 text-purple-800";
    case "payé":
      return "bg-indigo-100 text-indigo-800";
    case "refusé":
      return "bg-red-100 text-red-800";
    default:
      return "bg-back-100 text-back-800";
  }
});

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

async function acceptMission() {
  loading.value = true;
  try {
    await updateEntrepriseMission(props.slug, props.mission.id, {
      status: "validé",
    });
    emit("updated");
  } catch (err) {
    console.error("Erreur acceptation mission :", err);
    alert("❌ Impossible d'accepter la mission");
  } finally {
    loading.value = false;
  }
}

async function rejectMission() {
  loading.value = true;
  try {
    await updateEntrepriseMission(props.slug, props.mission.id, {
      status: "refusé",
    });
    emit("updated");
  } catch (err) {
    console.error("Erreur refus mission :", err);
    alert("❌ Impossible de refuser la mission");
  } finally {
    loading.value = false;
  }
}

async function markRealized() {
  loading.value = true;
  try {
    await updateEntrepriseMission(props.slug, props.mission.id, {
      status: "réalisé",
    });
    emit("updated");
  } catch (err) {
    console.error("Erreur lors du marquage réalisé :", err);
    alert("❌ Impossible de marquer la mission comme réalisée");
  } finally {
    loading.value = false;
  }
}

// 🚧 Placeholders
function createDevis() {
  console.log("📝 Générer un devis pour mission", props.mission.id);
}
function createFacture() {
  showFactureModal.value = true;
}
function handleFactureGenerated(data: unknown) {
  console.log("📄 Facture générée avec :", data);
}
function sendPaymentLink() {
  console.log("💳 Envoyer lien de paiement pour mission", props.mission.id);
}
function markPaid() {
  console.log("💰 Marquer mission comme payée", props.mission.id);
}
function closeMission() {
  console.log("📦 Clore mission", props.mission.id);
}
</script>
