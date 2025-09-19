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
            <div>
              <label class="text-sm font-medium">Nom</label>
              <input v-model="form.nom" type="text" class="input" />
            </div>
            <div>
              <label class="text-sm font-medium">Prénom</label>
              <input v-model="form.prenom" type="text" class="input" />
            </div>
          </div>

          <!-- Adresse -->
          <div>
            <label class="text-sm font-medium">Adresse</label>
            <input v-model="form.adresse" type="text" class="input" />
          </div>

          <!-- Email / Téléphone -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-sm font-medium">Email</label>
              <input v-model="form.email" type="email" class="input" />
            </div>
            <div>
              <label class="text-sm font-medium">Téléphone</label>
              <input v-model="form.telephone" type="tel" class="input" />
            </div>
          </div>

          <!-- SIRET / Statut -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-sm font-medium">SIRET</label>
              <input v-model="form.siret" type="text" class="input" />
            </div>
            <div>
              <label class="text-sm font-medium">Statut juridique</label>
              <input
                v-model="form.statut_juridique"
                type="text"
                class="input"
              />
            </div>
          </div>

          <!-- TVA / Mention -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-sm font-medium">TVA intracom</label>
              <input v-model="form.tva_intracom" type="text" class="input" />
            </div>
            <div>
              <label class="text-sm font-medium">Mention TVA</label>
              <input v-model="form.mention_tva" type="text" class="input" />
            </div>
          </div>

          <!-- Banque -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-sm font-medium">IBAN</label>
              <input v-model="form.iban" type="text" class="input" />
            </div>
            <div>
              <label class="text-sm font-medium">BIC</label>
              <input v-model="form.bic" type="text" class="input" />
            </div>
          </div>

          <!-- Taux horaire / Devise -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-sm font-medium">Taux horaire</label>
              <input
                v-model.number="form.taux_horaire"
                type="number"
                step="0.01"
                class="input"
              />
            </div>
            <div>
              <label class="text-sm font-medium">Devise</label>
              <input v-model="form.devise" type="text" class="input" />
            </div>
          </div>

          <!-- Conditions -->
          <div>
            <label class="text-sm font-medium">Conditions de paiement</label>
            <input
              v-model="form.conditions_paiement"
              type="text"
              class="input"
            />
          </div>

          <div>
            <label class="text-sm font-medium">Pénalités de retard</label>
            <input v-model="form.penalites_retard" type="text" class="input" />
          </div>
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

const props = defineProps<{
  open: boolean;
  entreprise: Entreprise;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "updated", data: Entreprise): void;
}>();

const loading = ref(false);
const form = ref<Partial<Entreprise>>({});

// ⚡ Remplir le formulaire quand on ouvre
watch(
  () => props.open,
  (val) => {
    if (val && props.entreprise) {
      form.value = { ...props.entreprise };
    }
  },
  { immediate: true }
);

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

<style scoped>
.input {
  @apply w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500;
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
