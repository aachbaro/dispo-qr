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
      <span
        class="px-2 py-1 text-xs rounded-full"
        :class="statusClasses[mission.status]"
      >
        {{ statusLabels[mission.status] || mission.status }}
      </span>
    </div>

    <!-- Adresse établissement -->
    <div
      v-if="mission.etablissement_adresse_ligne1 || mission.ville"
      class="text-sm text-gray-600"
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
    <p class="text-sm text-gray-600">
      📅 {{ formatDate(mission.date_slot) }} →
      {{ formatDate(mission.end_slot) }}
    </p>

    <!-- Instructions -->
    <p v-if="mission.instructions" class="text-sm italic text-gray-700">
      {{ mission.instructions }}
    </p>

    <!-- Mode -->
    <p class="text-sm">
      Mode : <b>{{ mission.mode }}</b>
    </p>

    <!-- Actions -->
    <div class="flex gap-2 mt-3 justify-end">
      <!-- Proposed -->
      <template v-if="mission.status === 'proposed'">
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

      <!-- Validated -->
      <template v-else-if="mission.status === 'validated'">
        <button class="btn-primary hover:bg-green-700" @click="createDevis">
          Créer devis
        </button>
        <button class="btn-primary hover:bg-gray-700" @click="markRealized">
          Marquer réalisée
        </button>
      </template>

      <!-- Realized -->
      <template v-else-if="mission.status === 'realized'">
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

      <!-- Pending payment -->
      <template v-else-if="mission.status === 'pending_payment'">
        <span class="text-sm text-yellow-600">Paiement en attente…</span>
        <button class="btn-primary hover:bg-green-700" @click="markPaid">
          Marquer payé
        </button>
      </template>

      <!-- Paid -->
      <template v-else-if="mission.status === 'paid'">
        <span class="text-sm text-green-600">Mission payée ✅</span>
        <button class="btn-primary hover:bg-gray-700" @click="closeMission">
          Clore
        </button>
      </template>

      <!-- Refused -->
      <template v-else-if="mission.status === 'refused'">
        <span class="text-sm text-red-500">Mission refusée</span>
      </template>

      <!-- Closed -->
      <template v-else-if="mission.status === 'closed'">
        <span class="text-sm text-gray-500">Mission clôturée</span>
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
import { ref, onMounted } from "vue";
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

// ----------------------
// Status labels & styles
// ----------------------
const statusLabels: Record<string, string> = {
  proposed: "Proposée",
  validated: "Validée",
  realized: "Réalisée",
  pending_payment: "Paiement en attente",
  paid: "Payée",
  refused: "Refusée",
  closed: "Clôturée",
};

const statusClasses: Record<string, string> = {
  proposed: "bg-yellow-100 text-yellow-800",
  validated: "bg-green-100 text-green-800",
  realized: "bg-blue-100 text-blue-800",
  pending_payment: "bg-purple-100 text-purple-800",
  paid: "bg-indigo-100 text-indigo-800",
  refused: "bg-red-100 text-red-800",
  closed: "bg-gray-100 text-gray-800",
};

// ----------------------
// Lifecycle
// ----------------------
onMounted(async () => {
  try {
    const response = await getEntreprise(props.slug);
    entreprise.value = response.data || response.entreprise || response;
  } catch (err) {
    console.error("❌ Erreur récupération entreprise :", err);
  }
});

// ----------------------
// Utils & actions
// ----------------------
function formatDate(dateStr: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

async function acceptMission() {
  await updateStatus("validated", "Impossible d'accepter la mission");
}
async function rejectMission() {
  await updateStatus("refused", "Impossible de refuser la mission");
}
async function markRealized() {
  await updateStatus(
    "realized",
    "Impossible de marquer la mission comme réalisée"
  );
}

// ----------------------
// Generic updater
// ----------------------
async function updateStatus(status: Mission["status"], errorMsg: string) {
  loading.value = true;
  try {
    await updateEntrepriseMission(props.slug, props.mission.id, { status });
    emit("updated");
  } catch (err) {
    console.error(errorMsg, err);
    alert("❌ " + errorMsg);
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
