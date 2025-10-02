<!-- src/components/ContactList.vue -->
<!-- -------------------------------------------------------------
 Liste des contacts du client (ContactList)
---------------------------------------------------------------
📌 Description :
 - Liste tous les contacts enregistrés par le client connecté
 - Chaque contact est affiché via ContactCard.vue
 - Un formulaire permet d’ajouter un extra via son slug

🔒 Règles d’accès :
 - Accessible uniquement au client propriétaire
--------------------------------------------------------------- -->

<template>
  <div class="space-y-6">
    <!-- Liste des contacts -->
    <div v-if="contacts.length" class="grid gap-4">
      <ContactCard
        v-for="c in contacts"
        :key="c.id"
        :contact="c"
        @deleted="handleDeleted"
      />
    </div>
    <p v-else class="text-gray-500">Aucun contact enregistré pour le moment.</p>

    <!-- Ajout de contact -->
    <div class="border rounded-lg p-4 bg-gray-50">
      <h3 class="font-semibold mb-2">➕ Ajouter un contact</h3>
      <form @submit.prevent="addNewContact" class="flex gap-2">
        <input
          v-model="newSlug"
          type="text"
          placeholder="Slug de l’entreprise (ex: resto-paris)"
          required
          class="flex-1 border rounded px-3 py-2"
        />
        <button
          type="submit"
          class="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          :disabled="loading"
        >
          {{ loading ? "Ajout..." : "Ajouter" }}
        </button>
      </form>
      <p v-if="error" class="text-sm text-red-600 mt-2">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import ContactCard from "./ContactCard.vue";
import {
  listContacts,
  addContact,
  type ClientContact,
} from "../services/contacts";
import { getEntreprise } from "../services/entreprises";
import { useAuth } from "../composables/useAuth";

const { user } = useAuth();
const contacts = ref<ClientContact[]>([]);
const newSlug = ref("");
const loading = ref(false);
const error = ref("");

// ----------------------
// Lifecycle
// ----------------------
onMounted(async () => {
  await fetchContacts();
});

async function fetchContacts() {
  if (!user.value) return;
  try {
    const { contacts: data } = await listContacts();
    contacts.value = data;
  } catch (err) {
    console.error("❌ Erreur récupération contacts :", err);
  }
}

// ----------------------
// Actions
// ----------------------
async function addNewContact() {
  if (!user.value) return;
  loading.value = true;
  error.value = "";

  try {
    // 🔍 Trouver entreprise par slug
    const { entreprise } = await getEntreprise(newSlug.value);
    if (!entreprise) {
      throw new Error("Entreprise introuvable");
    }

    // ➕ Ajouter le contact
    const { contact } = await addContact(entreprise.id);
    contacts.value.push({ ...contact, entreprise });
    newSlug.value = "";
  } catch (err: any) {
    console.error("❌ Erreur ajout contact:", err);
    error.value = err.message || "Erreur lors de l’ajout du contact";
  } finally {
    loading.value = false;
  }
}

function handleDeleted(id: number) {
  contacts.value = contacts.value.filter((c) => c.id !== id);
}
</script>
