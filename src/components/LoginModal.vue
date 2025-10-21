<!-- src/components/LoginModal.vue -->
<!-- -------------------------------------------------------------
 Modal de connexion utilisateur (email/password ou OAuth Google)
---------------------------------------------------------------

📌 Description :
  - Permet à l'utilisateur de se connecter manuellement
  - Propose une connexion rapide via Google OAuth

🔒 Règles d’accès :
  - Public
------------------------------------------------------------- -->

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
        class="relative w-full max-w-sm rounded-lg bg-white shadow-lg ring-1 ring-black/5"
      >
        <div class="px-5 py-4 border-b">
          <h2 class="text-lg font-semibold">Connexion</h2>
        </div>

        <div class="px-5 py-4 space-y-3">
          <input
            v-model="email"
            type="email"
            placeholder="Email"
            class="w-full rounded-lg border border-back-300 px-3 py-2"
          />
          <input
            v-model="password"
            type="password"
            placeholder="Mot de passe"
            class="w-full rounded-lg border border-back-300 px-3 py-2"
          />
          <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

          <!-- Divider -->
          <div class="flex items-center gap-2 text-gray-400">
            <hr class="flex-1 border-gray-300" />
            <span class="text-sm">ou</span>
            <hr class="flex-1 border-gray-300" />
          </div>

          <!-- Bouton Google -->
          <button
            type="button"
            class="w-full px-4 py-2 rounded bg-red-500 text-white font-semibold hover:bg-red-600"
            @click="handleGoogle"
          >
            Continuer avec Google
          </button>
        </div>

        <div class="px-5 py-4 border-t flex justify-end gap-2">
          <button
            type="button"
            class="px-4 py-2 rounded bg-back-200 hover:bg-back-300"
            @click="onCancel"
          >
            Annuler
          </button>
          <button
            type="button"
            class="btn-primary"
            :disabled="loading"
            @click="handleLogin"
          >
            {{ loading ? "Connexion..." : "Se connecter" }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useAuth } from "../composables/useAuth";
import { supabase } from "../services/supabase";
import { signInWithGoogle } from "../services/auth";
import type { AuthUser } from "../services/auth";

const props = defineProps({
  open: Boolean,
});
const emit = defineEmits(["close", "logged"]);

const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);
const { setUser } = useAuth();

function onCancel() {
  emit("close");
}

async function handleLogin() {
  loading.value = true;
  error.value = "";

  try {
    const { data, error: signInError } = await supabase.auth.signInWithPassword(
      {
        email: email.value,
        password: password.value,
      }
    );

    if (signInError) throw signInError;
    if (!data.user) throw new Error("Connexion échouée");

    const authUser: AuthUser = {
      id: data.user.id,
      email: data.user.email ?? "",
      role: data.user.user_metadata?.role,
      slug: data.user.user_metadata?.slug,
      nom: data.user.user_metadata?.nom,
      prenom: data.user.user_metadata?.prenom,
    };

    setUser(authUser);
    emit("logged", authUser);
    emit("close");
  } catch (err: any) {
    error.value = err.message || "Identifiants invalides.";
    console.error(err);
  } finally {
    loading.value = false;
  }
}

/** 🔐 Connexion Google */
async function handleGoogle() {
  try {
    await signInWithGoogle(); // redirige vers /auth/callback
  } catch (err: any) {
    error.value = err.message || "Erreur Google Sign-In.";
  }
}
</script>
