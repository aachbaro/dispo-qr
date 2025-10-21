<!-- src/components/auth/RegisterForm.vue -->
<!-- -------------------------------------------------------------
 Formulaire d’inscription de base
---------------------------------------------------------------
📌 Description :
 - Champs communs : prénom, nom, email, téléphone
 - Affiche le rôle choisi
--------------------------------------------------------------- -->

<template>
  <div class="w-full max-w-sm">
    <button class="text-sm text-gray-500 mb-3" @click="$emit('back')">
      ← Revenir
    </button>

    <h2 class="text-lg font-semibold mb-4">
      {{ role === "freelance" ? "Inscription Extra" : "Inscription Client" }}
    </h2>

    <form @submit.prevent="submit">
      <div class="flex flex-col gap-3">
        <input
          v-model="form.prenom"
          placeholder="Prénom"
          class="input"
          required
        />
        <input v-model="form.nom" placeholder="Nom" class="input" required />
        <input
          v-model="form.email"
          placeholder="Email"
          type="email"
          class="input"
          required
        />
        <input
          v-model="form.telephone"
          placeholder="Téléphone"
          class="input"
          required
        />
      </div>

      <button
        type="submit"
        class="mt-5 w-full bg-black text-white rounded-xl p-3 hover:bg-gray-800"
      >
        Continuer
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
const props = defineProps<{ role: "freelance" | "client" }>();
const emit = defineEmits(["submit", "back"]);

const form = ref({
  prenom: "",
  nom: "",
  email: "",
  telephone: "",
});

function submit() {
  emit("submit", { ...form.value, role: props.role });
}
</script>
