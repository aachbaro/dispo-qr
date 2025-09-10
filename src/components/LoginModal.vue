<template>
  <div>
    <!-- Bouton login / logout -->
    <button v-if="!isAdmin" @click="open = true" class="btn-primary">
      login
    </button>
    <button v-else @click="logoutUser" class="btn-primary">Logout</button>

    <!-- Modal -->
    <div
      v-if="open"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-xl shadow-lg p-6 w-80">
        <h2 class="text-lg font-semibold mb-4">Connexion admin</h2>
        <form @submit.prevent="handleLogin">
          <input
            type="password"
            v-model="password"
            placeholder="mot de passe"
            class="w-full border rounded-full px-3 py-1 mb-3"
          />
          <div class="flex justify-end gap-2">
            <button type="button" @click="closeModal" class="btn-primary">
              annuler
            </button>
            <button type="submit" class="btn-primary" :disabled="loading">
              {{ loading ? "..." : "valider" }}
            </button>
          </div>
        </form>
        <p v-if="error" class="text-red-500 mt-2 text-sm">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { login, logout } from "../services/api";

const open = ref(false);
const password = ref("");
const error = ref("");
const loading = ref(false);
const isAdmin = ref<boolean>(!!localStorage.getItem("adminToken"));

async function handleLogin() {
  loading.value = true;
  error.value = "";
  try {
    await login(password.value);
    isAdmin.value = true;
    closeModal();
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

function logoutUser() {
  logout();
  isAdmin.value = false;
}

function closeModal() {
  open.value = false;
  password.value = "";
  error.value = "";
}
</script>
