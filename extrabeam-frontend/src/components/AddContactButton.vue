<!-- src/components/AddContactButton.vue -->
<!-- -------------------------------------------------------------
 Bouton "Ajouter en contact"
---------------------------------------------------------------
📌 Description :
 - Permet à un client d’ajouter une entreprise à sa liste de contacts
 - Vérifie si l’entreprise est déjà dans la liste → désactive le bouton

🔒 Règles d’accès :
 - Accessible uniquement aux utilisateurs role = client (auth requise)
--------------------------------------------------------------- -->

<template>
  <div>
    <button
      class="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
      :disabled="loading || alreadyAdded"
      @click="handleAdd"
    >
      <span v-if="alreadyAdded">✅ Déjà dans vos contacts</span>
      <span v-else-if="loading">⏳ Ajout...</span>
      <span v-else>➕ Ajouter à mes contacts</span>
    </button>

    <p v-if="error" class="text-sm text-red-600 mt-2">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAuth } from "../composables/useAuth";
import { addContact, listContacts } from "../services/contacts";

const props = defineProps<{
  entrepriseId: number;
}>();

const { user } = useAuth();

const loading = ref(false);
const alreadyAdded = ref(false);
const error = ref("");

onMounted(async () => {
  if (!user.value) return;
  try {
    const { contacts } = await listContacts();

    // Vérifie par rapport à l'id de l'entreprise liée
    alreadyAdded.value = contacts.some(
      (c) => c.entreprise?.id === props.entrepriseId
    );
  } catch (err) {
    console.error("❌ Erreur chargement contacts:", err);
  }
});

async function handleAdd() {
  if (!user.value) {
    error.value = "Vous devez être connecté en tant que client.";
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    // ✅ idem, on ne passe que l’entreprise
    await addContact(props.entrepriseId);
    alreadyAdded.value = true;
  } catch (err: any) {
    console.error("❌ Erreur ajout contact:", err);
    error.value = err.message || "Erreur lors de l’ajout du contact.";
  } finally {
    loading.value = false;
  }
}
</script>
