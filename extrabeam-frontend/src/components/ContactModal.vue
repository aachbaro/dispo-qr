<template>
  <div
    v-if="open"
    class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    @click.self="close"
  >
    <div class="bg-white rounded-2xl shadow-xl p-6 w-80 text-center">
      <h2 class="text-xl font-bold mb-4">Me contacter</h2>

      <!-- Téléphone -->
      <a
        :href="`tel:${phone}`"
        class="flex items-center gap-3 p-3 rounded-lg hover:bg-back-100 transition"
      >
        <svg
          class="w-6 h-6 text-blue-600"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 
               19.79 0 0 1-8.63-3.07A19.5 
               19.5 0 0 1 3.07 12.8 
               19.79 19.79 0 0 1 0 4.18 
               2 2 0 0 1 2 2h3a2 2 0 0 1 
               2 1.72c.2 1.52.7 2.98 
               1.48 4.28a2 2 0 0 1-.45 
               2.62l-1.27 1.27a16 
               16 0 0 0 6.59 6.59l1.27-1.27a2 
               2 0 0 1 2.62-.45c1.3.78 
               2.76 1.28 4.28 1.48A2 2 0 0 1 
               22 16.92z"
          />
        </svg>
        <span class="text-back-700 font-medium">{{ phone }}</span>
      </a>

      <!-- Email -->
      <a
        :href="`mailto:${email}`"
        class="flex items-center gap-3 p-3 rounded-lg hover:bg-back-100 transition"
      >
        <svg
          class="w-6 h-6 text-green-600"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M4 4h16v16H4z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
        <span class="text-back-700 font-medium">{{ email }}</span>
      </a>

      <!-- Bouton fermer -->
      <button
        @click="close"
        class="mt-5 px-4 py-2 bg-back-800 text-white rounded-lg hover:bg-back-700 transition"
      >
        Fermer
      </button>
    </div>
  </div>
</template>

<script setup>

const props = defineProps({
  open: Boolean,
  phone: {
    type: String,
    default: "+33 7 83 06 54 99",
  },
  email: {
    type: String,
    default: "adam@example.com", // <-- mets ton vrai email ici
  },
});

const emit = defineEmits(["close"]);

function close() {
  emit("close");
}
</script>
