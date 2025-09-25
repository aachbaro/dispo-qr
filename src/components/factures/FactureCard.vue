<!-- src/components/factures/FactureCard.vue -->
<!-- -------------------------------------------------------------
 Carte d’une facture (FactureCard)
 ---------------------------------------------------------------
 📌 Description :
 - Affiche les détails d’une facture (client, montant, statut, lien paiement)
 - Permet de générer PDF, modifier, générer lien de paiement, supprimer

 🔒 Règles d’accès :
 - Actions réservées à l’owner entreprise
 ------------------------------------------------------------- -->

<template>
  <div
    class="border rounded-lg p-4 shadow-sm bg-white flex justify-between items-start"
  >
    <!-- Infos facture -->
    <div class="space-y-1">
      <h3 class="font-semibold">📄 Facture {{ facture.numero }}</h3>
      <p class="text-sm text-gray-600">
        Émise le {{ formatDate(facture.date_emission) }}
      </p>

      <!-- Client -->
      <p class="text-sm">Client : {{ facture.client_name }}</p>
      <div v-if="hasAddress" class="text-sm text-gray-700 ml-2">
        📍
        {{ facture.client_address_ligne1 }}
        <span v-if="facture.client_address_ligne2">
          , {{ facture.client_address_ligne2 }}
        </span>
        <br />
        {{ facture.client_code_postal || "" }} {{ facture.client_ville || "" }}
        <span v-if="facture.client_pays">({{ facture.client_pays }})</span>
      </div>

      <!-- Montant -->
      <p class="text-sm font-bold mt-1">
        Total TTC : {{ facture.montant_ttc.toFixed(2) }} €
      </p>

      <!-- Statut -->
      <span
        class="inline-block px-2 py-1 text-xs rounded-full mt-1"
        :class="statusClasses[facture.status]"
      >
        {{ statusLabels[facture.status] || facture.status }}
      </span>

      <!-- Paiement -->
      <div v-if="facture.payment_link" class="mt-2">
        💳
        <a
          :href="facture.payment_link"
          target="_blank"
          class="text-blue-600 underline"
        >
          Lien de paiement
        </a>
        <button
          class="ml-2 text-xs text-gray-600 underline"
          @click="copyPaymentLink"
        >
          Copier
        </button>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex flex-col gap-2 items-end">
      <button class="btn-secondary" @click="downloadPdf">⬇️ PDF</button>
      <button class="btn-secondary" @click="$emit('edit', facture)">
        ✏️ Modifier
      </button>
      <button class="btn-secondary" @click="onPaymentLink">💳 Paiement</button>
      <button class="btn-danger" @click="onDelete">🗑️ Supprimer</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Facture } from "../../services/factures";
import { useFactures } from "../../composables/useFactures";
import { generateFacturePdf } from "../../utils/pdf/facturePdf";
import { generateFacturePaymentLink } from "../../services/factures";

const props = defineProps<{
  facture: Facture;
  refEntreprise: string | number;
  entreprise: any; // ⚠️ doit contenir iban, bic, infos émetteur
}>();

const emit = defineEmits(["edit", "deleted", "updated"]);

const { removeFacture } = useFactures();

// ----------------------
// Status labels & styles
// ----------------------
const statusLabels: Record<string, string> = {
  pending: "En attente",
  paid: "Payée",
  cancelled: "Annulée",
};

const statusClasses: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("fr-FR");
}

const hasAddress = computed(
  () =>
    props.facture.client_address_ligne1 ||
    props.facture.client_address_ligne2 ||
    props.facture.client_code_postal ||
    props.facture.client_ville ||
    props.facture.client_pays
);

async function onDelete() {
  if (!confirm("Supprimer cette facture ?")) return;
  try {
    await removeFacture(props.refEntreprise, props.facture.id);
    emit("deleted", props.facture.id);
  } catch (err) {
    alert("❌ Erreur lors de la suppression de la facture");
    console.error(err);
  }
}

function downloadPdf() {
  try {
    generateFacturePdf(props.facture, props.entreprise);
  } catch (err) {
    console.error("❌ Erreur génération PDF:", err);
    alert("Impossible de générer le PDF.");
  }
}

async function onPaymentLink() {
  try {
    const { url } = await generateFacturePaymentLink(
      props.refEntreprise,
      props.facture.id
    );
    emit("updated", { ...props.facture, payment_link: url });
    alert("✅ Lien de paiement généré !");
  } catch (err) {
    console.error("❌ Erreur génération lien paiement:", err);
    alert("Impossible de générer le lien de paiement");
  }
}

async function copyPaymentLink() {
  if (!props.facture.payment_link) return;
  try {
    await navigator.clipboard.writeText(props.facture.payment_link);
    alert("Lien copié dans le presse-papier ✅");
  } catch (err) {
    console.error("❌ Erreur copie lien:", err);
    alert("Impossible de copier le lien");
  }
}
</script>

<style scoped>
.btn-secondary {
  @apply px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm;
}
.btn-danger {
  @apply px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-white text-sm;
}
</style>
