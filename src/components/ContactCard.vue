<!-- src/components/ContactCard.vue -->
<!-- -------------------------------------------------------------
 Carte d’un contact (ContactCard)
---------------------------------------------------------------
📌 Description :
 - Affiche les infos de base d’un contact (extra/entreprise)
 - Vue compacte → nom + email
 - Vue détaillée → adresse, téléphone, etc.
 - Action : supprimer le contact

🔒 Règles d’accès :
 - Accessible uniquement au client propriétaire
--------------------------------------------------------------- -->

<template>
  <div
    class="border rounded-lg p-4 cursor-pointer hover:shadow-md transition"
    @click="expanded = !expanded"
  >
    <!-- Vue compacte -->
    <div class="flex justify-between items-center">
      <h3 class="font-bold text-lg">
        {{ contact.entreprise?.nom }} {{ contact.entreprise?.prenom }}
      </h3>
      <p class="text-sm text-gray-600">
        {{ contact.entreprise?.email }}
      </p>
    </div>

    <!-- Vue détaillée -->
    <transition name="fade">
      <div v-if="expanded" class="mt-3 space-y-2 text-sm text-gray-700">
        <!-- Adresse -->
        <div
          v-if="contact.entreprise?.adresse_ligne1 || contact.entreprise?.ville"
        >
          📍 {{ contact.entreprise?.adresse_ligne1 }}
          <span v-if="contact.entreprise?.adresse_ligne2"
            >, {{ contact.entreprise?.adresse_ligne2 }}</span
          >,
          {{ contact.entreprise?.code_postal || "" }}
          {{ contact.entreprise?.ville || "" }}
          <span v-if="contact.entreprise?.pays"
            >({{ contact.entreprise?.pays }})</span
          >
        </div>

        <!-- Téléphone -->
        <div v-if="contact.entreprise?.telephone">
          📞
          <a
            :href="`tel:${contact.entreprise.telephone.replace(/\s+/g, '')}`"
            class="text-blue-600 underline"
          >
            {{ contact.entreprise.telephone }}
          </a>
        </div>

        <!-- IBAN/BIC -->
        <div v-if="contact.entreprise?.iban">
          💳 IBAN : <span class="font-mono">{{ contact.entreprise.iban }}</span>
        </div>
        <div v-if="contact.entreprise?.bic">
          BIC : <span class="font-mono">{{ contact.entreprise.bic }}</span>
        </div>

        <!-- Actions -->
        <div class="flex gap-2 mt-3 justify-center">
          <button
            class="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
            @click.stop="deleteThis"
            :disabled="loading"
          >
            ❌ Supprimer
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { removeContact, type ClientContact } from "../services/contacts";

const props = defineProps<{
  contact: ClientContact;
}>();

const emit = defineEmits(["deleted"]);

const expanded = ref(false);
const loading = ref(false);

async function deleteThis() {
  if (!confirm("Voulez-vous vraiment supprimer ce contact ?")) return;
  loading.value = true;
  try {
    await removeContact(props.contact.id);
    emit("deleted", props.contact.id);
  } catch (err) {
    console.error("❌ Erreur suppression contact :", err);
    alert("Erreur lors de la suppression");
  } finally {
    loading.value = false;
  }
}
</script>
