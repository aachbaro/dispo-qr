<template>
  <!-- Header -->
  <header class="bg-white border-b border-gray-200 shadow-sm">
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
          <span class="text-gray-700 font-medium"> 👤 {{ user.email }} </span>
          <button
            @click="goToMyEntreprise"
            class="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Mon compte
          </button>
          <button
            @click="logoutUser"
            class="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
          >
            Déconnexion
          </button>
        </template>

        <!-- Contact -->
        <button
          @click="onContact"
          class="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
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

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import LoginModal from "./LoginModal.vue";
import RegisterModal from "./RegisterModal.vue";
import ContactModal from "./ContactModal.vue";
import { useAuth } from "../composables/useAuth";
import { supabase } from "../services/supabase";

const router = useRouter();
const { user, setUser } = useAuth();

// États modals
const contactOpen = ref(false);
const openLogin = ref(false);
const openRegister = ref(false);

// Ouvre modal contact
function onContact() {
  contactOpen.value = true;
}

// Déconnexion
async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("❌ Erreur déconnexion:", error.message);
  }
  setUser(null);
  router.push("/");
}

// Accès à mon entreprise
function goToMyEntreprise() {
  if (user.value && user.value.slug) {
    router.push(`/entreprise/${user.value.slug}`);
  } else {
    alert("⚠️ Pas de slug défini pour votre entreprise.");
  }
}
</script>
