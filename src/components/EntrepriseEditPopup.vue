<!-- src/components/EntrepriseEditPopup.vue -->
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
        <div class="px-6 py-4 border-b">
          <h2 class="text-lg font-semibold">Modifier vos informations</h2>
        </div>

        <!-- Body -->
        <div class="px-6 py-4 space-y-4">
          <!-- Nom / Prénom -->
          <div class="grid grid-cols-2 gap-3">
            <FormField label="Nom" v-model="form.nom" />
            <FormField label="Prénom" v-model="form.prenom" />
          </div>

          <!-- Adresse -->
          <FormField label="Adresse" v-model="form.adresse" />

          <!-- Email / Téléphone -->
          <div class="grid grid-cols-2 gap-3">
            <FormField label="Email" type="email" v-model="form.email" />
            <FormField label="Téléphone" type="tel" v-model="form.telephone" />
          </div>

          <!-- SIRET / Statut -->
          <div class="grid grid-cols-2 gap-3">
            <FormField label="SIRET" v-model="form.siret" />
            <FormField
              label="Statut juridique"
              v-model="form.statut_juridique"
            />
          </div>

          <!-- TVA / Mention -->
          <div class="grid grid-cols-2 gap-3">
            <FormField label="TVA intracom" v-model="form.tva_intracom" />
            <FormField label="Mention TVA" v-model="form.mention_tva" />
          </div>

          <!-- Banque -->
          <div class="grid grid-cols-2 gap-3">
            <FormField label="IBAN" v-model="form.iban" />
            <FormField label="BIC" v-model="form.bic" />
          </div>

          <!-- Taux horaire / Devise -->
          <div class="grid grid-cols-2 gap-3">
            <FormField
              label="Taux horaire"
              type="number"
              step="0.01"
              v-model.number="form.taux_horaire"
            />
            <FormField label="Devise" v-model="form.devise" />
          </div>

          <!-- Conditions -->
          <FormField
            label="Conditions de paiement"
            v-model="form.conditions_paiement"
          />
          <FormField
            label="Pénalités de retard"
            v-model="form.penalites_retard"
          />
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t flex justify-end gap-2">
          <button
            class="px-4 py-2 rounded bg-back-200 hover:bg-back-300"
            @click="onCancel"
          >
            Annuler
          </button>
          <button
            class="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            :disabled="loading"
            @click="onConfirm"
          >
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { Entreprise } from "../services/entreprises";
import { updateEntreprise } from "../services/entreprises";
import FormField from "./ui/FormField.vue";

// ✅ Props
const props = defineProps<{
  open: boolean;
  entreprise: Entreprise;
}>();

// ✅ Events
const emit = defineEmits<{
  (e: "close"): void;
  (e: "updated", data: Entreprise): void;
}>();

// ✅ State
const loading = ref(false);
const form = ref<Partial<Entreprise>>({});

// ✅ Watch: quand on ouvre, remplir avec les infos actuelles
watch(
  () => props.open,
  (val) => {
    if (val && props.entreprise) {
      form.value = { ...props.entreprise };
    }
  },
  { immediate: true }
);

// ✅ Actions
function onCancel() {
  emit("close");
}

async function onConfirm() {
  if (!props.entreprise?.slug) return;

  loading.value = true;
  try {
    const { data } = await updateEntreprise(props.entreprise.slug, form.value);
    emit("updated", data);
    emit("close");
  } catch (err) {
    console.error("❌ Erreur mise à jour entreprise:", err);
    alert("Impossible de sauvegarder les changements");
  } finally {
    loading.value = false;
  }
}
</script>

<!-- ✅ Style factorisé -->
<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
