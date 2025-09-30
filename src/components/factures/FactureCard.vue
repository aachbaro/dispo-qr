<!-- src/components/factures/FactureCard.vue -->
<!-- -------------------------------------------------------------
 Carte d’une facture (FactureCard)
 ---------------------------------------------------------------
 📌 Description :
 - Affiche les détails d’une facture (client, montant, statut, lien paiement)
 - Permet de générer PDF, modifier, générer lien de paiement, supprimer

 🔒 Règles d’accès :
 - Actions réservées à l’owner entreprise

 ⚠️ Remarques :
 - Le champ `hours` n’existe plus (calcul côté backend via slots)
 - Statut `pending_payment` affiché comme "Paiement en attente"
 ------------------------------------------------------------- -->

<template>
  <div
    class="border rounded-lg p-4 shadow-sm bg-white cursor-pointer hover:shadow-md transition"
    @click.stop="expanded = !expanded"
  >
    <!-- Vue compacte -->
    <div class="flex justify-between items-center">
      <h3 class="font-semibold text-lg">📄 {{ facture.numero }}</h3>
      <p class="text-sm bg-gray-100 px-2 py-1 rounded-full">
        <b>{{ facture.client_name }}</b>
      </p>
      <span
        class="inline-block px-2 py-1 text-xs rounded-full"
        :class="statusClasses[facture.status]"
      >
        {{ statusLabels[facture.status] || facture.status }}
      </span>
    </div>

    <!-- Vue détaillée -->
    <transition name="fade">
      <div v-if="expanded" class="mt-3 space-y-2">
        <!-- Infos facture -->
        <div class="flex justify-between items-center">
          <p class="text-sm font-bold pl-4">
            TTC : {{ facture.montant_ttc.toFixed(2) }} €
          </p>
          <p class="text-sm text-gray-600">
            {{ formatDate(facture.date_emission) }}
          </p>
        </div>
        <!-- Paiement -->
        <div v-if="facture.payment_link" class="text-sm text-blue-600 hidden">
          🔗 Lien paiement dispo
        </div>

        <!-- Actions -->
        <div class="flex justify-between gap-2 pt-1">
          <!-- Paiement -->
          <div class="flex items-center gap-2">
            <!-- Si lien dispo -->
            <template v-if="facture.payment_link">
              <!-- Lien cliquable -->
              <a
                :href="facture.payment_link"
                target="_blank"
                class="flex items-center gap-1 text-sm text-blue-600 px-2 py-1 rounded hover:bg-gray-100 transition"
                @click.stop
              >
                <Icon name="link" class="w-4 h-4" />
                Lien de paiement
              </a>

              <!-- Copier -->
              <div class="relative group">
                <button class="btn-primary p-1" @click.stop="copyPaymentLink">
                  <Icon name="document-duplicate" class="w-4 h-4" />
                </button>
                <span
                  class="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 text-xs rounded bg-gray-800 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-75"
                >
                  Copier le lien
                </span>
              </div>

              <!-- Régénérer -->
              <div class="relative group">
                <button class="btn-primary p-1" @click.stop="onPaymentLink">
                  <Icon name="arrow-path" class="w-4 h-4" />
                </button>
                <span
                  class="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 text-xs rounded bg-gray-800 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-75"
                >
                  Régénérer lien
                </span>
              </div>
            </template>

            <!-- Si pas encore de lien -->
            <template v-else>
              <div class="relative group">
                <button
                  class="btn-primary p-0 px-3 text-sm"
                  @click.stop="onPaymentLink"
                >
                  Générer un lien de paiement
                </button>
                <span
                  class="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 text-xs rounded bg-gray-800 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-75"
                >
                  Générer lien de paiement
                </span>
              </div>
            </template>
          </div>
          <!-- action sur la facture -->
          <div class="flex gap-2">
            <button class="btn-primary p-1" @click.stop="downloadPdf">
              <Icon name="download" class="w-4 h-4" />
            </button>
            <button
              class="btn-primary p-1"
              @click.stop="$emit('edit', facture)"
            >
              <Icon name="pencil" class="w-4 h-4" />
            </button>
            <button
              class="btn-primary hover:bg-red-700 p-1"
              @click.stop="onDelete"
            >
              <Icon name="trash" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { Facture } from "../../services/factures";
import { useFactures } from "../../composables/useFactures";
import { generateFacturePdf } from "../../utils/pdf/facturePdf";
import { generateFacturePaymentLink } from "../../services/factures";
import Icon from "../ui/Icon.vue";

const props = defineProps<{
  facture: Facture;
  refEntreprise: string | number;
  entreprise: any; // ⚠️ doit contenir iban, bic, infos émetteur
}>();

const emit = defineEmits(["edit", "deleted", "updated"]);

const { removeFacture } = useFactures();
const expanded = ref(false); // 👈 toggle vue détaillée

// ----------------------
// Status labels & styles
// ----------------------
const statusLabels: Record<string, string> = {
  pending_payment: "Paiement en attente",
  paid: "Payée",
  cancelled: "Annulée",
};

const statusClasses: Record<string, string> = {
  pending_payment: "bg-yellow-100 text-yellow-800",
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
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
