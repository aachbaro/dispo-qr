<!-- src/pages/register.vue -->
<!-- -------------------------------------------------------------
 Page d’inscription
---------------------------------------------------------------
📌 Description :
 - Permet à l'utilisateur de s'inscrire selon son rôle :
   • client → recruteur
   • freelance → extra
 - Formulaire commun : prénom, nom, email, téléphone

🔒 Règles d’accès :
 - Accessible à tous (non authentifié)
--------------------------------------------------------------- -->

<template>
  <div class="flex flex-col items-center justify-center min-h-screen p-6">
    <h1 class="text-2xl font-bold mb-6">Créer un compte</h1>

    <RegisterRoleSelect v-if="!role" @select="role = $event" />

    <RegisterForm v-else :role="role" @submit="onSubmit" @back="role = null" />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import RegisterRoleSelect from "@/components/auth/RegisterRoleSelect.vue";
import RegisterForm from "@/components/auth/RegisterForm.vue";
import { useRegister } from "@/composables/useRegister";

const { registerUser } = useRegister();
const role = ref<"freelance" | "client" | null>(null);

async function onSubmit(payload: {
  role: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
}) {
  await registerUser(payload);
}
</script>
