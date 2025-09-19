<template>
  <section class="font-sans">
    <Header />
    <div class="h-[70vh]">
      <RouterView />
    </div>
  </section>
</template>

<script setup lang="ts">
import Header from "./components/Header.vue";
</script>