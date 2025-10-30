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
        class="relative w-full max-w-sm rounded-lg bg-white shadow-lg ring-1 ring-black/5 overflow-y-auto max-h-[90vh]"
      >
        <div class="px-5 py-4 border-b">
          <h2 class="text-lg font-semibold">Inscription</h2>
        </div>

        <div class="px-5 py-4 space-y-3">
          <!-- Email -->
          <input
            v-model="email"
            type="email"
            placeholder="Email"
            class="w-full rounded-lg border border-back-300 px-3 py-2"
            required
          />

          <!-- Password -->
          <input
            v-model="password"
            type="password"
            placeholder="Mot de passe"
            class="w-full rounded-lg border border-back-300 px-3 py-2"
            required
          />

          <!-- Role -->
          <select
            v-model="role"
            class="w-full rounded-lg border border-back-300 px-3 py-2"
          >
            <option value="freelance">Freelance</option>
            <option value="client">Client</option>
          </select>

          <!-- Bloc infos entreprise (si freelance) -->
          <div v-if="role === 'freelance'" class="space-y-2 border-t pt-3">
            <h3 class="text-sm font-semibold text-back-700">
              Informations de base
            </h3>

            <input
              v-model="entreprise.nom"
              type="text"
              placeholder="Nom"
              class="w-full rounded-lg border border-back-300 px-3 py-2"
              required
            />
            <input
              v-model="entreprise.prenom"
              type="text"
              placeholder="Prénom"
              class="w-full rounded-lg border border-back-300 px-3 py-2"
              required
            />

            <p class="text-xs text-back-500">
              Vous pourrez compléter votre profil (adresse, SIRET, IBAN, etc.)
              plus tard dans votre tableau de bord.
            </p>
          </div>

          <!-- Erreur -->
          <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
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
            class="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            :disabled="loading"
            @click="handleRegister"
          >
            {{ loading ? "Inscription..." : "S'inscrire" }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { ApiError } from "@/services/api";
import { register as registerUser } from "@/services/auth";
import { supabase } from "@/services/supabase";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits(["close", "registered"]);

const router = useRouter();

const email = ref("");
const password = ref("");
const role = ref<"freelance" | "client">("freelance");
const error = ref("");
const loading = ref(false);

const entreprise = ref({
  nom: "",
  prenom: "",
});

function onCancel() {
  emit("close");
}

async function handleRegister() {
  loading.value = true;
  error.value = "";

  try {
    // 1️⃣ Appel à ton API backend pour créer user + profile + entreprise
    const data = await registerUser({
      email: email.value,
      password: password.value,
      role: role.value,
      entreprise: role.value === "freelance" ? entreprise.value : undefined,
    });
    console.log("✅ Utilisateur inscrit:", data);

    emit("registered", data);

    // 2️⃣ Connexion automatique du nouvel utilisateur
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });

    if (loginError) {
      console.error("❌ Erreur login auto:", loginError.message);
    } else {
      console.log("🔑 Login auto réussi !");
    }

    // 3️⃣ Redirection
    if (data.entreprise?.slug) {
      router.push(`/entreprise/${data.entreprise.slug}`);
    } else {
      router.push("/");
    }

    emit("close");
  } catch (err: any) {
    if (err instanceof ApiError) {
      error.value = err.body?.error || "❌ Erreur lors de l'inscription.";
    } else {
      error.value = err?.message || "❌ Erreur lors de l'inscription.";
    }
    console.error(err);
  } finally {
    loading.value = false;
  }
}
</script>
