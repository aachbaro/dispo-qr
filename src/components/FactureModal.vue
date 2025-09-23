// src/components/FactureModal.vue
// -------------------------------------------------------------
// Modal de génération de facture
// -------------------------------------------------------------
//
// 📌 Description :
//   - Permet à une entreprise connectée de générer une facture
//   - Pré-remplit les infos de l’entreprise et de la mission
//   - Calcule automatiquement heures travaillées, HT, TTC
//
// 🔒 Règles d’accès :
//   - Accessible uniquement aux entreprises connectées
//   - Les infos entreprise proviennent de la table entreprise
//
// ⚠️ Remarques :
//   - Le numéro de facture est saisi manuellement (format YYYY-NNNN)
//   - Message explicatif sous le champ pour rappeler l’obligation légale
//
// -------------------------------------------------------------

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
        aria-labelledby="popup-title"
      >
        <!-- Header -->
        <div class="px-5 py-4 border-b">
          <h2 id="popup-title" class="text-lg font-semibold">
            Générer une facture
          </h2>
        </div>

        <!-- Body -->
        <div class="px-5 py-4 space-y-4">
          <!-- Émetteur -->
          <div>
            <h3 class="text-sm font-semibold text-gray-700">Émetteur</h3>
            <div class="grid grid-cols-2 gap-3">
              <input v-model="entNom" type="text" class="input" placeholder="Nom" />
              <input v-model="entPrenom" type="text" class="input" placeholder="Prénom" />
              <input v-model="entAdresse" type="text" class="col-span-2 input" placeholder="Adresse" />
              <input v-model="entEmail" type="email" class="input" placeholder="Email" />
              <input v-model="entTelephone" type="text" class="input" placeholder="Téléphone" />
              <input v-model="entSiret" type="text" class="input" placeholder="SIRET" />
              <input v-model="entStatut" type="text" class="input" placeholder="Statut juridique" />
            </div>
          </div>

          <!-- Mentions -->
          <div>
            <h3 class="text-sm font-semibold text-gray-700">Mentions légales</h3>
            <textarea v-model="entMentionTva" rows="1" class="input w-full" />
            <textarea v-model="entConditions" rows="1" class="input w-full" />
            <textarea v-model="entPenalites" rows="1" class="input w-full" />
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
                ⚖️ <b>Attention :</b> le numéro de facture doit être
                <b>unique, chronologique et sans trou</b> pour toute votre activité.
                Exemple recommandé : <code>2025-0001</code>, <code>2025-0002</code>, etc.
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
          <div class="space-y-1">
            <label class="text-sm font-medium">Établissement</label>
            <input v-model="clientName" type="text" class="input w-full" />
          </div>
          <div class="space-y-1">
            <label class="text-sm font-medium">Adresse client</label>
            <textarea v-model="clientAddress" rows="2" class="input w-full"></textarea>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <input v-model="contactName" type="text" class="input" placeholder="Nom contact" />
            <input v-model="contactPhone" type="text" class="input" placeholder="Téléphone" />
          </div>
          <input v-model="contactEmail" type="email" class="input w-full" placeholder="Email" />

          <!-- Description -->
          <div class="space-y-1">
            <label class="text-sm font-medium">Description</label>
            <textarea v-model="description" rows="3" class="input w-full"></textarea>
          </div>

          <!-- Heures / taux -->
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-sm font-medium">Durée (heures)</label>
              <input v-model="hours" type="number" step="0.25" class="input w-full" />
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium">Taux horaire (€)</label>
              <input v-model="rate" type="number" step="0.01" class="input w-full" />
            </div>
          </div>

          <!-- Montants -->
          <div class="grid grid-cols-3 gap-3 mt-2">
            <div class="space-y-1">
              <label class="text-sm font-medium">Montant HT (€)</label>
              <input :value="amountHt" type="number" class="input w-full bg-gray-100" readonly />
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium">TVA (%)</label>
              <input v-model="tvaRate" type="number" step="0.1" class="input w-full" />
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium">Total TTC (€)</label>
              <input :value="totalTtc" type="number" class="input w-full bg-gray-100" readonly />
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-5 py-4 border-t flex justify-end gap-2">
          <button type="button" class="btn-primary hover:bg-red-700" @click="onCancel">
            Annuler
          </button>
          <button type="button" class="btn-primary hover:bg-blue-700" @click="generate">
            Générer
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";

const props = defineProps({
  open: Boolean,
  mission: { type: Object, required: true },
  entreprise: { type: Object, required: true },
});

const emit = defineEmits(["close", "generated"]);

const entNom = ref("");
const entPrenom = ref("");
const entAdresse = ref("");
const entEmail = ref("");
const entTelephone = ref("");
const entSiret = ref("");
const entStatut = ref("");
const entMentionTva = ref("");
const entConditions = ref("");
const entPenalites = ref("");

const clientName = ref("");
const clientAddress = ref("");
const contactName = ref("");
const contactPhone = ref("");
const contactEmail = ref("");
const description = ref("");

const invoiceNumber = ref("");
const invoiceDate = ref(new Date().toLocaleDateString("fr-FR"));
const invoiceError = ref("");

const hours = ref(0);
const rate = ref(0);
const tvaRate = ref(0);

const amountHt = computed(() => (hours.value * rate.value).toFixed(2));
const totalTtc = computed(() => {
  const ht = parseFloat(amountHt.value) || 0;
  const tva = parseFloat(tvaRate.value) || 0;
  return (ht * (1 + tva / 100)).toFixed(2);
});

function validateInvoiceNumber(num: string): boolean {
  const regex = /^\d{4}-\d{1,}$/;
  return regex.test(num);
}

watch(
  () => props.entreprise,
  (e) => {
    if (e) {
      entNom.value = e.nom;
      entPrenom.value = e.prenom;
      entAdresse.value = e.adresse;
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
      clientAddress.value = m.etablissement_address || "";
      contactName.value = m.contact_name || "";
      contactPhone.value = m.contact_phone || "";
      contactEmail.value = m.contact_email || "";
      description.value = `Mission du ${new Date(m.date_slot).toLocaleString("fr-FR", {
        dateStyle: "short",
        timeStyle: "short",
      })}`;

      const start = new Date(m.date_slot);
      const end = new Date(m.end_slot);
      const diffMs = end.getTime() - start.getTime();
      hours.value = diffMs > 0 ? diffMs / 1000 / 60 / 60 : 0;
    }
  },
  { immediate: true }
);

function onCancel() {
  emit("close");
}

function generate() {
  invoiceError.value = "";

  if (!invoiceNumber.value) {
    invoiceError.value = "Numéro de facture obligatoire.";
    return;
  }
  if (!validateInvoiceNumber(invoiceNumber.value)) {
    invoiceError.value = "Format invalide. Utiliser AAAA-NNNN (ex: 2025-0001).";
    return;
  }

  if (!clientName.value || !hours.value || !rate.value) {
    alert("Merci de vérifier les infos du client, le nombre d'heures et le taux.");
    return;
  }

  emit("generated", {
    invoiceNumber: invoiceNumber.value,
    invoiceDate: invoiceDate.value,
    entreprise: {
      nom: entNom.value,
      prenom: entPrenom.value,
      adresse: entAdresse.value,
      email: entEmail.value,
      telephone: entTelephone.value,
      siret: entSiret.value,
      statut_juridique: entStatut.value,
      mention_tva: entMentionTva.value,
      conditions_paiement: entConditions.value,
      penalites_retard: entPenalites.value,
    },
    clientName: clientName.value,
    clientAddress: clientAddress.value,
    contactName: contactName.value,
    contactPhone: contactPhone.value,
    contactEmail: contactEmail.value,
    description: description.value,
    hours: parseFloat(hours.value.toString()),
    rate: parseFloat(rate.value.toString()),
    amountHt: parseFloat(amountHt.value),
    tvaRate: parseFloat(tvaRate.value),
    totalTtc: parseFloat(totalTtc.value),
  });

  emit("close");
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
