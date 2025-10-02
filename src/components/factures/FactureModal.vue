<!-- src/components/FactureModal.vue -->
<template>
  <Transition name="fade">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      @keydown.esc.prevent="onCancel"
    >
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black/50" @click="onCancel" />

      <!-- Modal -->
      <div
        class="relative w-full max-w-2xl rounded-lg bg-white shadow-lg ring-1 ring-black/5 overflow-y-auto max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        <!-- Header -->
        <div class="px-5 py-4 border-b">
          <h2 id="popup-title" class="text-lg font-semibold">
            Générer une facture
          </h2>
        </div>

        <!-- Body -->
        <div class="px-5 py-4 space-y-6">
          <!-- Émetteur -->
          <div>
            <h3 class="text-sm font-semibold text-gray-700">Émetteur</h3>
            <div class="grid grid-cols-2 gap-3 mt-2">
              <input
                v-model="entNom"
                type="text"
                class="input"
                placeholder="Nom"
              />
              <input
                v-model="entPrenom"
                type="text"
                class="input"
                placeholder="Prénom"
              />

              <input
                v-model="entAdresseLigne1"
                type="text"
                class="col-span-2 input"
                placeholder="Adresse ligne 1"
              />
              <input
                v-model="entAdresseLigne2"
                type="text"
                class="col-span-2 input"
                placeholder="Adresse ligne 2"
              />

              <input
                v-model="entCodePostal"
                type="text"
                class="input"
                placeholder="Code postal"
              />
              <input
                v-model="entVille"
                type="text"
                class="input"
                placeholder="Ville"
              />
              <input
                v-model="entPays"
                type="text"
                class="col-span-2 input"
                placeholder="Pays"
              />

              <input
                v-model="entEmail"
                type="email"
                class="input"
                placeholder="Email"
              />
              <input
                v-model="entTelephone"
                type="text"
                class="input"
                placeholder="Téléphone"
              />

              <input
                v-model="entSiret"
                type="text"
                class="input"
                placeholder="SIRET"
              />
              <input
                v-model="entStatut"
                type="text"
                class="input"
                placeholder="Statut juridique"
              />
            </div>
          </div>

          <!-- Mentions -->
          <div>
            <h3 class="text-sm font-semibold text-gray-700">
              Mentions légales
            </h3>
            <textarea
              v-model="entMentionTva"
              rows="1"
              class="input w-full"
              placeholder="Mention TVA"
            />
            <textarea
              v-model="entConditions"
              rows="1"
              class="input w-full"
              placeholder="Conditions de paiement"
            />
            <textarea
              v-model="entPenalites"
              rows="1"
              class="input w-full"
              placeholder="Pénalités de retard"
            />
          </div>

          <!-- Numéro + date -->
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1 relative">
              <label class="text-sm font-medium">Facture N°</label>
              <input
                v-model="invoiceNumber"
                type="text"
                class="input"
                placeholder="Ex: 2025-0001"
                required
              />
              <p class="text-xs text-gray-700 mt-1">
                ⚖️
                <b>Le numéro doit être unique, chronologique et sans trou.</b>
              </p>
              <p v-if="invoiceError" class="text-sm text-red-600 mt-1">
                {{ invoiceError }}
              </p>
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium">Date d’émission</label>
              <input
                v-model="invoiceDate"
                type="text"
                class="input bg-gray-100"
                readonly
              />
            </div>
          </div>

          <!-- Client -->
          <div>
            <h3 class="text-sm font-semibold text-gray-700">Client</h3>
            <div class="space-y-2 mt-2">
              <input
                v-model="clientName"
                type="text"
                class="input w-full"
                placeholder="Nom établissement"
              />
              <input
                v-model="clientAdresseLigne1"
                type="text"
                class="input w-full"
                placeholder="Adresse ligne 1"
              />
              <input
                v-model="clientAdresseLigne2"
                type="text"
                class="input w-full"
                placeholder="Adresse ligne 2"
              />

              <div class="grid grid-cols-2 gap-3">
                <input
                  v-model="clientCodePostal"
                  type="text"
                  class="input"
                  placeholder="Code postal"
                />
                <input
                  v-model="clientVille"
                  type="text"
                  class="input"
                  placeholder="Ville"
                />
              </div>
              <input
                v-model="clientPays"
                type="text"
                class="input w-full"
                placeholder="Pays"
              />

              <div class="grid grid-cols-2 gap-3">
                <input
                  v-model="contactName"
                  type="text"
                  class="input"
                  placeholder="Nom contact"
                />
                <input
                  v-model="contactPhone"
                  type="text"
                  class="input"
                  placeholder="Téléphone"
                />
              </div>
              <input
                v-model="contactEmail"
                type="email"
                class="input w-full"
                placeholder="Email"
              />
            </div>
          </div>

          <!-- Description -->
          <div class="space-y-1">
            <label class="text-sm font-medium">Description</label>
            <textarea
              v-model="description"
              rows="3"
              class="input w-full"
            ></textarea>
          </div>

          <!-- Heures / taux -->
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-sm font-medium">Durée (heures)</label>
              <input
                v-model="hours"
                type="number"
                step="0.25"
                class="input w-full"
              />
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium">Taux horaire (€)</label>
              <input
                v-model="rate"
                type="number"
                step="0.01"
                class="input w-full"
              />
            </div>
          </div>

          <!-- Montants -->
          <div class="grid grid-cols-3 gap-3 mt-2">
            <div class="space-y-1">
              <label class="text-sm font-medium">Montant HT (€)</label>
              <input
                :value="amountHt"
                type="number"
                class="input w-full bg-gray-100"
                readonly
              />
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium">TVA (%)</label>
              <input
                v-model="tvaRate"
                type="number"
                step="0.1"
                class="input w-full"
              />
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium">Total TTC (€)</label>
              <input
                :value="totalTtc"
                type="number"
                class="input w-full bg-gray-100"
                readonly
              />
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-5 py-4 border-t flex justify-end gap-2">
          <button
            type="button"
            class="btn-primary hover:bg-red-700"
            @click="onCancel"
          >
            Annuler
          </button>
          <button
            type="button"
            class="btn-primary hover:bg-blue-700"
            @click="generate"
          >
            Générer
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { createEntrepriseFacture } from "../../services/factures";

const props = defineProps({
  open: Boolean,
  mission: { type: Object, required: false },
  entreprise: { type: Object, required: true },
});

const emit = defineEmits(["close", "created"]);

// ----------------------
// State émetteur (entreprise)
// ----------------------
const entNom = ref("");
const entPrenom = ref("");
const entAdresseLigne1 = ref("");
const entAdresseLigne2 = ref("");
const entCodePostal = ref("");
const entVille = ref("");
const entPays = ref("");
const entEmail = ref("");
const entTelephone = ref("");
const entSiret = ref("");
const entStatut = ref("");
const entMentionTva = ref("");
const entConditions = ref("");
const entPenalites = ref("");

// ----------------------
// State client (mission)
// ----------------------
const clientName = ref("");
const clientAdresseLigne1 = ref("");
const clientAdresseLigne2 = ref("");
const clientCodePostal = ref("");
const clientVille = ref("");
const clientPays = ref("");
const contactName = ref("");
const contactPhone = ref("");
const contactEmail = ref("");
const description = ref("");

// ----------------------
// Facture
// ----------------------
const invoiceNumber = ref("");
const invoiceDate = ref(new Date().toISOString().slice(0, 10));
const invoiceError = ref("");

const hours = ref(0);
const rate = ref(0);
const tvaRate = ref(0);
const loading = ref(false);

const amountHt = computed(() => (hours.value * rate.value).toFixed(2));
const totalTtc = computed(() => {
  const ht = parseFloat(amountHt.value) || 0;
  const tva = parseFloat(tvaRate.value) || 0;
  return (ht * (1 + tva / 100)).toFixed(2);
});

// ----------------------
// Préremplissages
// ----------------------
watch(
  () => props.entreprise,
  (e) => {
    if (e) {
      entNom.value = e.nom;
      entPrenom.value = e.prenom;
      entAdresseLigne1.value = e.adresse_ligne1 || "";
      entAdresseLigne2.value = e.adresse_ligne2 || "";
      entCodePostal.value = e.code_postal || "";
      entVille.value = e.ville || "";
      entPays.value = e.pays || "";
      entEmail.value = e.email;
      entTelephone.value = e.telephone || "";
      entSiret.value = e.siret;
      entStatut.value = e.statut_juridique;
      entMentionTva.value = e.mention_tva;
      entConditions.value = e.conditions_paiement;
      entPenalites.value = e.penalites_retard;
      rate.value = e.taux_horaire || 0;
    }
  },
  { immediate: true }
);

watch(
  () => props.mission,
  (m) => {
    if (m) {
      clientName.value = m.etablissement || "";
      clientAdresseLigne1.value = m.etablissement_adresse_ligne1 || "";
      clientAdresseLigne2.value = m.etablissement_adresse_ligne2 || "";
      clientCodePostal.value = m.etablissement_code_postal || "";
      clientVille.value = m.etablissement_ville || "";
      clientPays.value = m.etablissement_pays || "";
      contactName.value = m.contact_name || "";
      contactPhone.value = m.contact_phone || "";
      contactEmail.value = m.contact_email || "";

      if (m.slots?.length) {
        const first = new Date(m.slots[0].start);
        const last = new Date(m.slots[m.slots.length - 1].end);
        description.value = `Mission du ${first.toLocaleDateString(
          "fr-FR"
        )} au ${last.toLocaleDateString("fr-FR")}`;

        let totalHours = 0;
        for (const slot of m.slots) {
          const start = new Date(slot.start);
          const end = new Date(slot.end);
          const diffMs = end.getTime() - start.getTime();
          if (diffMs > 0) totalHours += diffMs / 1000 / 60 / 60;
        }
        hours.value = totalHours;
      } else {
        description.value = "Mission sans créneaux définis";
        hours.value = 0;
      }
    }
  },
  { immediate: true }
);

// ----------------------
// Handlers
// ----------------------
function onCancel() {
  emit("close");
}

function validateInvoiceNumber(num: string): boolean {
  return /^\d{4}-\d{1,}$/.test(num);
}

async function generate() {
  invoiceError.value = "";
  if (!validateInvoiceNumber(invoiceNumber.value)) {
    invoiceError.value = "Format invalide. Utiliser AAAA-NNNN (ex: 2025-0001).";
    return;
  }
  if (!clientName.value || !hours.value || !rate.value) {
    alert("Merci de vérifier les infos client, heures et taux.");
    return;
  }

  loading.value = true;
  try {
    const payload = {
      numero: invoiceNumber.value,
      date_emission: invoiceDate.value,
      entreprise_id: props.entreprise.id,
      mission_id: props.mission?.id ?? null,

      client_name: clientName.value,
      client_address_ligne1: clientAdresseLigne1.value,
      client_address_ligne2: clientAdresseLigne2.value,
      client_code_postal: clientCodePostal.value,
      client_ville: clientVille.value,
      client_pays: clientPays.value,
      contact_name: contactName.value,
      contact_phone: contactPhone.value,
      contact_email: contactEmail.value,

      description: description.value,
      hours: parseFloat(hours.value.toString()),
      rate: parseFloat(rate.value.toString()),
      montant_ht: parseFloat(amountHt.value),
      tva: parseFloat(tvaRate.value),
      montant_ttc: parseFloat(totalTtc.value),

      mention_tva: entMentionTva.value,
      conditions_paiement: entConditions.value,
      penalites_retard: entPenalites.value,
    };

    const { facture } = await createEntrepriseFacture(
      props.entreprise.id,
      payload
    );

    emit("created", facture);
    emit("close");
  } catch (err) {
    console.error("❌ Erreur génération facture :", err);
    alert("Impossible de générer la facture");
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.input {
  @apply rounded-lg border border-gray-300 px-3 py-2;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
