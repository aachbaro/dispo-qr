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

<script setup>
import { ref } from "vue";
import { login } from "../services/auth";
import { useAuth } from "../composables/useAuth";

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
    const data = await login(email.value, password.value);
    console.log("✅ Login réussi:", data);

    setUser(data.user);
    emit("logged", data.user);
    emit("close");
  } catch (err) {
    error.value = "Identifiants invalides.";
    console.error(err);
  } finally {
    loading.value = false;
  }
}
</script>
