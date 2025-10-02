<!-- src/pages/auth/RegisterPage.vue -->
<!-- -------------------------------------------------------------
 Page d’inscription
---------------------------------------------------------------
📌 Description :
 - Permet de créer un compte (freelance ou restaurateur/client)
 - Deux modes :
   • Email + mot de passe + infos de base (formulaire)
   • Connexion via Google (OAuth Supabase)

🔒 Règles d’accès :
 - Publique (accessible sans authentification)

⚠️ Remarques :
 - Freelance → création entreprise liée avec nom/prénom
 - Client/Restaurateur → inscription simple
--------------------------------------------------------------- -->

<template>
  <div class="max-w-lg mx-auto p-6 space-y-8">
    <!-- Header -->
    <div class="text-center space-y-2">
      <h1 class="text-2xl font-bold">Créer un compte</h1>
      <p class="text-gray-600">Rejoignez Dispo-QR et simplifiez vos missions</p>
    </div>

    <!-- Formulaire classique -->
    <form @submit.prevent="handleRegister" class="space-y-4">
      <!-- Email -->
      <input
        v-model="email"
        type="email"
        placeholder="Email"
        class="w-full rounded-lg border border-gray-300 px-3 py-2"
        required
      />

      <!-- Mot de passe -->
      <input
        v-model="password"
        type="password"
        placeholder="Mot de passe"
        class="w-full rounded-lg border border-gray-300 px-3 py-2"
        required
      />

      <!-- Choix rôle -->
      <select
        v-model="role"
        class="w-full rounded-lg border border-gray-300 px-3 py-2"
      >
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
          class="w-full rounded-lg border border-gray-300 px-3 py-2"
          required
        />
        <input
          v-model="entreprise.prenom"
          type="text"
          placeholder="Prénom"
          class="w-full rounded-lg border border-gray-300 px-3 py-2"
          required
        />
        <p class="text-xs text-gray-500">
          Vous pourrez compléter votre profil (adresse, SIRET, IBAN, etc.) plus
          tard dans votre tableau de bord.
        </p>
      </div>

      <!-- Erreur -->
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

      <!-- Bouton submit -->
      <button
        type="submit"
        class="w-full px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
        :disabled="loading"
      >
        {{ loading ? "Inscription..." : "S'inscrire" }}
      </button>
    </form>

    <!-- Divider -->
    <div class="flex items-center gap-2 text-gray-400">
      <hr class="flex-1 border-gray-300" />
      <span class="text-sm">ou</span>
      <hr class="flex-1 border-gray-300" />
    </div>

    <!-- Inscription via Google -->
    <div class="text-center">
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
import { supabase } from "../../services/supabase";

const router = useRouter();

const email = ref("");
const password = ref("");
const role = ref<"freelance" | "restaurateur">("freelance");
const error = ref("");
const loading = ref(false);

const entreprise = ref({
  nom: "",
  prenom: "",
});

/** Inscription classique email/password */
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
      throw new Error(err.error || "Erreur inscription");
    }

    const data = await res.json();
    console.log("✅ Utilisateur inscrit:", data);

    // connexion automatique
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });

    if (loginError) throw new Error(loginError.message);

    if (data.entreprise?.slug) {
      router.push(`/entreprise/${data.entreprise.slug}`);
    } else {
      router.push("/");
    }
  } catch (err: any) {
    error.value = err.message || "❌ Erreur lors de l'inscription.";
  } finally {
    loading.value = false;
  }
}

/** Inscription via Google OAuth */
async function handleGoogle() {
  try {
    const { error: googleError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (googleError) throw new Error(googleError.message);
  } catch (err: any) {
    error.value = err.message || "❌ Erreur Google Sign-In.";
  }
}
</script>
