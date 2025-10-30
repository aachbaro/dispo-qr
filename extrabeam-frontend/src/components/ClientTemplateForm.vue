<!-- src/components/ClientTemplateForm.vue -->
<!-- -------------------------------------------------------------
 Formulaire création modèle de mission (mission_template)
---------------------------------------------------------------
📌 Description :
 - Permet à un client de créer un modèle de mission réutilisable
 - Champs principaux : nom, établissement, adresse, contact, instructions, mode

🔒 Règles d’accès :
 - Accessible uniquement aux utilisateurs role = client (auth requise)

⚠️ Remarques :
 - Envoi via service createTemplate()
 - Émet un évènement "created" pour rafraîchir la liste
--------------------------------------------------------------- -->

<template>
  <div class="p-6 border rounded-lg shadow-sm bg-white space-y-4">
    <h2 class="text-lg font-semibold">➕ Nouveau modèle de mission</h2>

    <form @submit.prevent="handleSubmit" class="space-y-3">
      <!-- Nom du modèle -->
      <input
        v-model="nom"
        type="text"
        placeholder="Nom du modèle (ex: Service du soir)"
        required
        class="w-full border rounded px-3 py-2"
      />

      <!-- Etablissement -->
      <input
        v-model="etablissement"
        type="text"
        placeholder="Nom de l’établissement"
        required
        class="w-full border rounded px-3 py-2"
      />

      <!-- Adresse -->
      <input
        v-model="adresseLigne1"
        type="text"
        placeholder="Adresse (ligne 1)"
        required
        class="w-full border rounded px-3 py-2"
      />
      <input
        v-model="adresseLigne2"
        type="text"
        placeholder="Complément d’adresse (ligne 2)"
        class="w-full border rounded px-3 py-2"
      />

      <!-- CP / Ville -->
      <div class="grid grid-cols-2 gap-3">
        <input
          v-model="codePostal"
          type="text"
          placeholder="Code postal"
          class="w-full border rounded px-3 py-2"
        />
        <input
          v-model="ville"
          type="text"
          placeholder="Ville"
          class="w-full border rounded px-3 py-2"
        />
      </div>

      <!-- Pays -->
      <input
        v-model="pays"
        type="text"
        placeholder="Pays"
        class="w-full border rounded px-3 py-2"
      />

      <!-- Contact -->
      <input
        v-model="contactName"
        type="text"
        placeholder="Nom du contact"
        class="w-full border rounded px-3 py-2"
      />
      <input
        v-model="contactEmail"
        type="email"
        placeholder="Email contact"
        class="w-full border rounded px-3 py-2"
      />
      <input
        v-model="contactPhone"
        type="tel"
        placeholder="Téléphone contact"
        class="w-full border rounded px-3 py-2"
      />

      <!-- Instructions -->
      <textarea
        v-model="instructions"
        rows="2"
        placeholder="Instructions spécifiques (facultatif)"
        class="w-full border rounded px-3 py-2"
      ></textarea>

      <!-- Mode -->
      <select v-model="mode" class="w-full border rounded px-3 py-2">
        <option value="freelance">Freelance (auto-entrepreneur)</option>
        <option value="salarié">Salarié (contrat d'extra)</option>
      </select>

      <!-- Erreur -->
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

      <!-- Bouton -->
      <button
        type="submit"
        class="w-full px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        :disabled="loading"
      >
        {{ loading ? "Création..." : "Créer le modèle" }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import {
  createTemplate,
  type MissionTemplateInsert,
} from "../services/templates";

const emit = defineEmits<{
  (e: "created", template: any): void;
}>();

// ----------------------
// Champs formulaire
// ----------------------
const nom = ref("");
const etablissement = ref("");
const adresseLigne1 = ref("");
const adresseLigne2 = ref("");
const codePostal = ref("");
const ville = ref("");
const pays = ref("");
const contactName = ref("");
const contactEmail = ref("");
const contactPhone = ref("");
const instructions = ref("");
const mode = ref("freelance");

const loading = ref(false);
const error = ref("");

// ----------------------
// Soumission formulaire
// ----------------------
async function handleSubmit() {
  loading.value = true;
  error.value = "";

  const payload: MissionTemplateInsert = {
    nom: nom.value,
    etablissement: etablissement.value,
    etablissement_adresse_ligne1: adresseLigne1.value,
    etablissement_adresse_ligne2: adresseLigne2.value || null,
    etablissement_code_postal: codePostal.value || null,
    etablissement_ville: ville.value || null,
    etablissement_pays: pays.value || null,
    contact_name: contactName.value || null,
    contact_email: contactEmail.value || null,
    contact_phone: contactPhone.value || null,
    instructions: instructions.value || null,
    mode: mode.value,
  };

  try {
    const { template } = await createTemplate(payload);

    // Reset formulaire
    resetForm();

    emit("created", template);
  } catch (err: any) {
    error.value = err.message || "❌ Erreur lors de la création du modèle";
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  nom.value = "";
  etablissement.value = "";
  adresseLigne1.value = "";
  adresseLigne2.value = "";
  codePostal.value = "";
  ville.value = "";
  pays.value = "";
  contactName.value = "";
  contactEmail.value = "";
  contactPhone.value = "";
  instructions.value = "";
  mode.value = "freelance";
}
</script>
