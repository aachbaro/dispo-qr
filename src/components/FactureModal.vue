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
        class="relative w-full max-w-md rounded-lg bg-white shadow-lg ring-1 ring-black/5"
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
          <!-- Client -->
          <div class="space-y-1">
            <label class="text-sm font-medium">Établissement</label>
            <input
              v-model="clientName"
              type="text"
              class="w-full rounded-lg border border-back-300 px-3 py-2"
            />
          </div>

          <div class="space-y-1">
            <label class="text-sm font-medium">Adresse client</label>
            <textarea
              v-model="clientAddress"
              rows="2"
              placeholder="Ex: 40 rue Richer, 75009 Paris"
              class="w-full rounded-lg border border-back-300 px-3 py-2"
            ></textarea>
          </div>

          <!-- Contact -->
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <label class="text-sm font-medium">Nom contact</label>
              <input
                v-model="contactName"
                type="text"
                class="w-full rounded-lg border border-back-300 px-3 py-2"
              />
            </div>
            <div class="space-y-1">
              <label class="text-sm font-medium">Téléphone</label>
              <input
                v-model="contactPhone"
                type="text"
                class="w-full rounded-lg border border-back-300 px-3 py-2"
              />
            </div>
          </div>

          <div class="space-y-1">
            <label class="text-sm font-medium">Email</label>
            <input
              v-model="contactEmail"
              type="email"
              class="w-full rounded-lg border border-back-300 px-3 py-2"
            />
          </div>

          <!-- Description -->
          <div class="space-y-1">
            <label class="text-sm font-medium">Description</label>
            <textarea
              v-model="description"
              rows="3"
              class="w-full rounded-lg border border-back-300 px-3 py-2"
            ></textarea>
          </div>

          <!-- Montant -->
          <div class="space-y-1">
            <label class="text-sm font-medium">Montant (€)</label>
            <input
              v-model="amount"
              type="number"
              min="0"
              step="0.01"
              class="w-full rounded-lg border border-back-300 px-3 py-2"
            />
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

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  open: Boolean,
  mission: { type: Object, required: true },
});

const emit = defineEmits(["close", "generated"]);

const clientName = ref("");
const clientAddress = ref("");
const contactName = ref("");
const contactPhone = ref("");
const contactEmail = ref("");
const description = ref("");
const amount = ref(0);

watch(
  () => props.mission,
  (m) => {
    if (m) {
      clientName.value = m.etablissement || "";
      clientAddress.value = m.etablissement_address || "";
      contactName.value = m.contact_name || "";
      contactPhone.value = m.contact_phone || "";
      contactEmail.value = m.contact_email || "";
      description.value = `Mission du ${new Date(m.date_slot).toLocaleString(
        "fr-FR",
        {
          dateStyle: "short",
          timeStyle: "short",
        }
      )}`;
    }
  },
  { immediate: true }
);

function onCancel() {
  emit("close");
}

function generate() {
  if (!clientName.value || !amount.value) {
    alert("Merci de remplir le nom du client et le montant.");
    return;
  }

  emit("generated", {
    clientName: clientName.value,
    clientAddress: clientAddress.value,
    contactName: contactName.value,
    contactPhone: contactPhone.value,
    contactEmail: contactEmail.value,
    description: description.value,
    amount: parseFloat(amount.value),
  });

  emit("close");
}
</script>

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
