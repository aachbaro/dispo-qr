<!-- src/components/factures/FactureCard.vue -->
<!-- -------------------------------------------------------------
 Carte d’une facture (FactureCard)
 ---------------------------------------------------------------
 📌 Description :
 - Affiche les détails d’une facture (client, montant, statut, lien paiement)
 - En mode entreprise : peut éditer, supprimer, générer lien paiement
 - En mode client (readonly) : peut télécharger PDF et voir lien de paiement

 🔒 Règles d’accès :
 - Actions sensibles (edit/delete/lien) → owner uniquement
 - Client → lecture seule
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
        <div v-if="facture.payment_link" class="text-sm mt-2">
          <a
            :href="facture.payment_link"
            target="_blank"
            class="flex items-center gap-1 text-blue-600 hover:underline"
            @click.stop
          >
            <Icon name="link" class="w-4 h-4" />
            Accéder au paiement
          </a>
        </div>

        <!-- Actions -->
        <div class="flex justify-between gap-2 pt-3">
          <!-- Toujours dispo : téléchargement PDF -->
          <button class="btn-primary p-1" @click.stop="downloadPdf">
            <Icon name="download" class="w-4 h-4" />
          </button>

          <!-- Actions sensibles : uniquement si !readonly -->
          <div v-if="!readonly" class="flex gap-2">
            <!-- Gestion du lien paiement -->
            <button
              v-if="!facture.payment_link"
              class="btn-primary p-1 text-sm"
              @click.stop="onPaymentLink"
            >
              Générer lien
            </button>
            <button v-else class="btn-primary p-1" @click.stop="onPaymentLink">
              <Icon name="arrow-path" class="w-4 h-4" />
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
import { ref, computed } from "vue";
import type { FactureWithRelations } from "../../services/factures";
import { useFactures } from "../../composables/useFactures";
import { generateFacturePdf } from "../../utils/pdf/facturePdf";
import { generateFacturePaymentLink } from "../../services/factures";
import Icon from "../ui/Icon.vue";

const props = defineProps<{
  facture: FactureWithRelations;
  entreprise?: any;
  readonly?: boolean; // 👈 permet de basculer client vs entreprise
}>();

const emit = defineEmits(["edit", "deleted", "updated"]);

const { removeFacture } = useFactures();
const expanded = ref(false);

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

const entrepriseForPdf = computed(() => {
  return props.entreprise || props.facture.missions?.entreprise || {};
});

// ----------------------
// Utils
// ----------------------
function formatDate(date: string) {
  return new Date(date).toLocaleDateString("fr-FR");
}

function downloadPdf() {
  try {
    generateFacturePdf(props.facture, entrepriseForPdf.value);
  } catch (err) {
    console.error("❌ Erreur génération PDF:", err);
    alert("Impossible de générer le PDF.");
  }
}

async function onPaymentLink() {
  if (props.readonly) return;
  try {
    const { url } = await generateFacturePaymentLink(props.facture.id);
    emit("updated", { ...props.facture, payment_link: url });
    alert("✅ Lien de paiement généré !");
  } catch (err) {
    console.error("❌ Erreur génération lien paiement:", err);
    alert("Impossible de générer le lien de paiement");
  }
}

async function onDelete() {
  if (props.readonly) return;
  if (!confirm("Supprimer cette facture ?")) return;
  try {
    await removeFacture(props.facture.id);
    emit("deleted", props.facture.id);
  } catch (err) {
    console.error("❌ Erreur suppression facture:", err);
    alert("Erreur lors de la suppression");
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
