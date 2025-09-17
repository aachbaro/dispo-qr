<template>
  <div class="max-w-xl mx-auto bg-white rounded-xl shadow p-6 space-y-4">
    <h2 class="text-xl font-bold">Proposer une mission</h2>

    <!-- Etablissement -->
    <div>
      <label class="block text-sm font-medium mb-1">Établissement</label>
      <input
        v-model="etablissement"
        type="text"
        placeholder="Nom de l'établissement"
        class="w-full border rounded-lg px-3 py-2"
      />
    </div>

    <!-- Contact -->
    <div>
      <label class="block text-sm font-medium mb-1"
        >Contact (email ou téléphone)</label
      >
      <input
        v-model="contact"
        type="text"
        placeholder="ex: client@email.com"
        class="w-full border rounded-lg px-3 py-2"
      />
    </div>

    <!-- Instructions -->
    <div>
      <label class="block text-sm font-medium mb-1">Instructions</label>
      <textarea
        v-model="instructions"
        rows="3"
        placeholder="Précisions sur la mission..."
        class="w-full border rounded-lg px-3 py-2"
      ></textarea>
    </div>

    <!-- Mode -->
    <div>
      <label class="block text-sm font-medium mb-1"
        >Mode de collaboration</label
      >
      <select v-model="mode" class="w-full border rounded-lg px-3 py-2">
        <option value="freelance">
          Freelance (facturation auto-entrepreneur)
        </option>
        <option value="salarié">Salarié (contrat d'extra)</option>
      </select>
    </div>

    <!-- Date du créneau -->
    <div>
      <label class="block text-sm font-medium mb-1"
        >Créneau (date & heure)</label
      >
      <input
        v-model="dateSlot"
        type="datetime-local"
        class="w-full border rounded-lg px-3 py-2"
      />
    </div>

    <!-- Bouton -->
    <button
      @click="submitForm"
      class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
      :disabled="loading"
    >
      {{ loading ? "Envoi en cours..." : "Envoyer la demande" }}
    </button>

    <!-- Message succès -->
    <p v-if="successMessage" class="text-green-600 text-center mt-3">
      {{ successMessage }}
    </p>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { createMission } from "../services/missions";

const etablissement = ref("");
const contact = ref("");
const instructions = ref("");
const mode = ref("freelance");
const dateSlot = ref("");
const loading = ref(false);
const successMessage = ref("");

async function submitForm() {
  if (!etablissement.value || !contact.value || !dateSlot.value) {
    alert("Merci de remplir tous les champs obligatoires.");
    return;
  }

  loading.value = true;

  try {
    await createMission({
      etablissement: etablissement.value,
      contact: contact.value,
      instructions: instructions.value,
      mode: mode.value,
      date_slot: dateSlot.value,
    });

    successMessage.value = "✅ Votre demande a bien été envoyée !";

    etablissement.value = "";
    contact.value = "";
    instructions.value = "";
    mode.value = "freelance";
    dateSlot.value = "";
  } catch (err) {
    console.error(err);
    alert("❌ Erreur lors de l’envoi.");
  } finally {
    loading.value = false;
  }
}
</script>
