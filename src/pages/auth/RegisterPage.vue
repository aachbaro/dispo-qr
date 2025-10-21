<!-- src/pages/auth/RegisterPage.vue -->
<!-- -------------------------------------------------------------
 Page d’inscription (manuelle + rapide)
---------------------------------------------------------------
📌 Description :
 - Permet à l'utilisateur de s'inscrire selon deux modes :
   • Email + mot de passe (formulaire manuel)
   • Magic Link ou Google OAuth (connexion rapide)
 - Enregistre le rôle (freelance ou client) + infos basiques

🔒 Règles d’accès :
 - Publique (accessible sans session)

⚠️ Remarques :
 - Freelance → crée automatiquement une entreprise
 - Client → crée seulement un profil
--------------------------------------------------------------- -->

<template>
  <div class="max-w-lg mx-auto p-6 space-y-8">
    <!-- Header -->
    <div class="text-center space-y-2">
      <h1 class="text-2xl font-bold">Créer un compte</h1>
      <p class="text-gray-600">
        Rejoignez ExtraBeam et gérez vos missions facilement
      </p>
    </div>

    <!-- Formulaire manuel -->
    <form @submit.prevent="handleRegister" class="space-y-4">
      <!-- Email -->
      <input
        v-model="email"
        type="email"
        placeholder="Email"
        class="input"
        required
      />

      <!-- Mot de passe -->
      <input
        v-model="password"
        type="password"
        placeholder="Mot de passe"
        class="input"
        required
      />

      <!-- Choix rôle -->
      <select v-model="role" class="input">
        <option value="freelance">Je suis extra</option>
        <option value="client">Je suis restaurateur</option>
      </select>

      <!-- Bloc entreprise si freelance -->
      <div v-if="role === 'freelance'" class="space-y-2 border-t pt-3">
        <h3 class="text-sm font-semibold text-gray-700">
          Informations de base
        </h3>
        <input
          v-model="entreprise.nom"
          type="text"
          placeholder="Nom"
          class="input"
          required
        />
        <input
          v-model="entreprise.prenom"
          type="text"
          placeholder="Prénom"
          class="input"
          required
        />
        <p class="text-xs text-gray-500">
          Vous pourrez compléter votre profil (adresse, SIRET, IBAN, etc.) plus
          tard.
        </p>
      </div>

      <!-- Erreur -->
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

      <!-- Bouton submit -->
      <button type="submit" class="btn-primary" :disabled="loading">
        {{ loading ? "Inscription..." : "Créer un compte" }}
      </button>
    </form>

    <!-- Divider -->
    <div class="flex items-center gap-2 text-gray-400">
      <hr class="flex-1 border-gray-300" />
      <span class="text-sm">ou</span>
      <hr class="flex-1 border-gray-300" />
    </div>

    <!-- Connexion rapide -->
    <div class="space-y-3 text-center">
      <button
        @click="handleMagicLink"
        class="w-full px-4 py-2 rounded bg-black text-white font-semibold hover:bg-gray-800"
      >
        Recevoir un lien magique ✉️
      </button>

      <button
        @click="handleGoogle"
        class="w-full px-4 py-2 rounded bg-red-500 text-white font-semibold hover:bg-red-600"
      >
        Continuer avec Google
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "@/composables/useAuth";

const router = useRouter();
const { loginGoogle, loginMagicLink } = useAuth();

const email = ref("");
const password = ref("");
const role = ref<"freelance" | "client">("freelance");
const error = ref("");
const loading = ref(false);

const entreprise = ref({
  nom: "",
  prenom: "",
});

/** 🧱 Inscription manuelle via API backend */
async function handleRegister() {
  loading.value = true;
  error.value = "";

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.value,
        password: password.value,
        role: role.value,
        entreprise: role.value === "freelance" ? entreprise.value : undefined,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erreur d'inscription.");
    }

    const data = await res.json();
    console.log("✅ Utilisateur inscrit:", data);

    // Redirection selon type
    if (data.entreprise?.slug) {
      router.push(`/entreprise/${data.entreprise.slug}`);
    } else {
      router.push("/dashboard");
    }
  } catch (err: any) {
    error.value = err.message || "❌ Erreur lors de l'inscription.";
  } finally {
    loading.value = false;
  }
}

/** ✉️ Connexion via lien magique Supabase */
async function handleMagicLink() {
  try {
    await loginMagicLink(email.value, {
      role: role.value,
      nom: entreprise.value.nom,
      prenom: entreprise.value.prenom,
    });
  } catch (err: any) {
    error.value = err.message || "Erreur Magic Link.";
  }
}

/** 🔐 Connexion via Google OAuth */
async function handleGoogle() {
  try {
    await loginGoogle();
  } catch (err: any) {
    error.value = err.message || "Erreur Google Sign-In.";
  }
}
</script>

<style scoped>
.input {
  @apply w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black;
}
.btn-primary {
  @apply w-full px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50;
}
</style>
