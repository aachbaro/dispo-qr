<template>
  <!-- Header -->
  <header class="bg-white border-b border-black-600 shadow-sm">
    <div class="max-w-6xl mx-auto w-full flex justify-between items-center p-4">
      <!-- Logo / titre -->
      <h1 class="text-2xl font-bold cursor-pointer" @click="router.push('/')">
        Dispo-QR
      </h1>

      <!-- Actions -->
      <div class="flex gap-3 items-center">
        <!-- Si pas connecté -->
        <template v-if="!user">
          <button
            @click="openLogin = true"
            class="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Se connecter
          </button>
          <button
            @click="openRegister = true"
            class="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
          >
            S’inscrire
          </button>
        </template>

        <!-- Si connecté -->
        <template v-else>
          <button
            @click="goToMyEntreprise"
            class="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Mon compte
          </button>
          <button
            @click="logout"
            class="px-4 py-2 rounded bg-back-200 hover:bg-back-300"
          >
            Déconnexion
          </button>
        </template>

        <!-- Contact -->
        <button
          @click="onContact"
          class="px-4 py-2 rounded bg-back-100 hover:bg-back-200"
        >
          Contact
        </button>
      </div>
    </div>
  </header>

  <!-- Modals -->
  <LoginModal v-if="openLogin" :open="openLogin" @close="openLogin = false" />
  <RegisterModal
    v-if="openRegister"
    :open="openRegister"
    @close="openRegister = false"
  />

  <ContactModal
    :open="contactOpen"
    @close="contactOpen = false"
    phone="+33 7 83 06 54 99"
    email="adam.achbarou@gmail.com"
  />
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { clearAuth } from "../services/auth";
import LoginModal from "./LoginModal.vue";
import RegisterModal from "./RegisterModal.vue";
import ContactModal from "./ContactModal.vue";
import { useAuth } from "../composables/useAuth";

const router = useRouter();
const { user, setUser } = useAuth();

// états modals
const contactOpen = ref(false);
const openLogin = ref(false);
const openRegister = ref(false);

// état connexion
function onContact() {
  contactOpen.value = true;
}

function logout() {
  clearAuth();
  setUser(null);
  router.push("/");
}

function goToMyEntreprise() {
  if (user.value && user.value.slug) {
    router.push(`/entreprise/${user.value.slug}`);
  } else {
    alert("⚠️ Pas de slug défini pour votre entreprise.");
  }
}
</script>
