<!-- src/components/MissionCard.vue -->
<!-- -------------------------------------------------------------
 Carte d’une mission (MissionCard)
 ---------------------------------------------------------------
 📌 Description :
 - Affiche les détails d’une mission (contact, slots, statut)
 - Permet d’accepter/refuser/mettre à jour le statut
 - Intègre la facturation inline :
   • Génération via FactureModal
   • Affichage FactureCard si facture existe

 🔒 Règles d’accès :
 - Affichage public si mission transmise
 - Actions réservées à l’owner entreprise

 ⚠️ Remarques :
 - Les créneaux sont affichés depuis mission.slots[]
 - Charge l’entreprise via son slug pour alimenter FactureModal
 ------------------------------------------------------------- -->

<template>
  <div
    class="border rounded-lg p-4 cursor-pointer hover:shadow-md transition"
    @click="expanded = !expanded"
  >
    <!-- Vue compacte -->
    <div class="flex justify-between items-center">
      <h3 class="font-bold text-lg">{{ mission.etablissement }}</h3>
      <p v-if="mission.slots?.length" class="text-sm text-gray-600">
        {{ formatDate(mission.slots[0].start) }}
      </p>
      <!-- Status -->
      <span
        class="px-2 py-1 text-xs rounded-full"
        :class="statusClasses[mission.status]"
      >
        {{ statusLabels[mission.status] || mission.status }}
      </span>
    </div>

    <!-- Vue détaillée -->
    <transition name="fade">
      <div v-if="expanded" class="mt-3 space-y-2">
        <!-- Adresse établissement -->
        <div
          v-if="
            mission.etablissement_adresse_ligne1 || mission.etablissement_ville
          "
          class="text-sm text-gray-600"
        >
          📍
          {{ mission.etablissement_adresse_ligne1 || "" }},
          <span v-if="mission.etablissement_adresse_ligne2">
            , {{ mission.etablissement_adresse_ligne2 }},
          </span>
          {{ mission.etablissement_code_postal || "" }},
          {{ mission.etablissement_ville || "" }}
          <span v-if="mission.etablissement_pays">
            ({{ mission.etablissement_pays }})
          </span>
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

        <!-- Créneaux -->
        <div
          v-if="mission.slots?.length"
          class="space-y-1 text-sm text-gray-600"
        >
          <p v-for="slot in mission.slots" :key="slot.start">
            📅 {{ formatDate(slot.start) }} → {{ formatDate(slot.end) }}
          </p>
        </div>

        <!-- Instructions -->
        <p v-if="mission.instructions" class="text-sm italic text-gray-700">
          {{ mission.instructions }}
        </p>

        <!-- Mode -->
        <p class="text-sm">
          Mode : <b>{{ mission.mode }}</b>
        </p>

        <!-- Actions -->
        <div class="flex gap-2 mt-3 justify-center">
          <!-- Proposed -->
          <template v-if="mission.status === 'proposed'">
            <button
              class="btn-primary hover:bg-blue-700"
              @click.stop="acceptMission"
              :disabled="loading"
            >
              Accepter
            </button>
            <button
              class="btn-primary hover:bg-red-700"
              @click.stop="rejectMission"
              :disabled="loading"
            >
              Refuser
            </button>
          </template>

          <!-- Validated -->
          <template v-else-if="mission.status === 'validated'">
            <button
              class="btn-primary hover:bg-green-700"
              @click.stop="createDevis"
            >
              Devis
            </button>
            <button
              class="btn-primary hover:bg-gray-700"
              @click.stop="markRealized"
            >
              Marquer réalisée
            </button>
          </template>

          <!-- Pending payment -->
          <template v-else-if="mission.status === 'pending_payment'">
            <span class="text-sm text-yellow-600">Paiement en attente…</span>
            <button
              class="btn-primary hover:bg-green-700"
              @click.stop="markPaid"
            >
              Marquer payé
            </button>
          </template>

          <!-- Paid -->
          <template v-else-if="mission.status === 'paid'">
            <span class="text-sm text-green-600">Mission payée ✅</span>
            <button
              class="btn-primary hover:bg-gray-700"
              @click.stop="closeMission"
            >
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

        <!-- Facturation -->
        <div v-if="mission.status === 'realized'" class="mt-4 border-t pt-3">
          <h4 class="text-md font-semibold mb-2">📑 Facturation</h4>

          <!-- Si pas encore de facture -->
          <div v-if="!facture">
            <button
              class="btn-primary hover:bg-green-700"
              @click.stop="createFacture"
            >
              Générer une facture
            </button>
          </div>

          <!-- Si une facture existe -->
          <div v-else>
            <FactureCard
              :facture="facture"
              :ref-entreprise="slug"
              :entreprise="entreprise"
              @deleted="handleFactureDeleted"
              @updated="handleFactureUpdated"
              @edit="handleFactureEdit"
            />
          </div>
        </div>
      </div>
    </transition>
  </div>

  <!-- FactureModal pour création -->
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
import { updateEntrepriseMission } from "../../services/missions";
import { getEntreprise } from "../../services/entreprises";
import { listFacturesByMission } from "../../services/factures"; // ⚡ à créer
import FactureModal from "../factures/FactureModal.vue";
import FactureCard from "../factures/FactureCard.vue";
import type { Mission } from "../../services/missions";

const props = defineProps<{
  mission: Mission;
  slug: string;
}>();

const emit = defineEmits(["updated"]);
const loading = ref(false);
const showFactureModal = ref(false);
const entreprise = ref<any>(null);
const expanded = ref(false);
const facture = ref<any>(null);

// ----------------------
// Status labels & styles
// ----------------------
const statusLabels: Record<string, string> = {
  proposed: "Proposée",
  validated: "Acceptée",
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

    // Charger facture liée
    const factures = await listFacturesByMission(props.slug, props.mission.id);
    facture.value = factures.length ? factures[0] : null;
  } catch (err) {
    console.error("❌ Erreur récupération données :", err);
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

// ----------------------
// Facturation handlers
// ----------------------
function createDevis() {
  console.log("📝 Générer un devis pour mission", props.mission.id);
}
function createFacture() {
  showFactureModal.value = true;
}
function handleFactureGenerated(f: any) {
  facture.value = f;
  showFactureModal.value = false;
}
function handleFactureDeleted() {
  facture.value = null;
}
function handleFactureUpdated(f: any) {
  facture.value = f;
}
function handleFactureEdit(f: any) {
  console.log("✏️ Edit facture :", f);
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
