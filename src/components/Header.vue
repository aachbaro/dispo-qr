<template>
  <!-- fixed sur desktop, fond blanc + fine bordure -->
  <header class="static lg:top-0 lg:left-0 lg:w-full z-50 bg-white">
    <div class="w-full flex justify-between items-center p-4">
      <h1 class="text-2xl font-bold">Adam - Disponibilitées</h1>
      <div class="flex gap-4">
        <button @click="onContact" class="btn-primary">contact</button>
        <LoginModal />
      </div>
    </div>
  </header>
  <!-- ✅ Popup contact -->
  <ContactModal
    :open="contactOpen"
    @close="contactOpen = false"
    phone="+33 7 83 06 54 99"
    email="adam.achbarou@gmail.com"
  />
</template>

<script setup>
import { ref } from "vue";
import LoginModal from "./LoginModal.vue";
import ContactModal from "./ContactModal.vue";

const contactOpen = ref(false);
const isOpen = ref(false);
const toggleMenu = () => (isOpen.value = !isOpen.value);
const closeMenu = () => (isOpen.value = false);

function onLoginClicked() {
  console.log("➡️ 'Vous êtes moi ?' cliqué");
}

function onContact() {
  contactOpen.value = true;
}
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: transform 0.18s ease, opacity 0.18s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
