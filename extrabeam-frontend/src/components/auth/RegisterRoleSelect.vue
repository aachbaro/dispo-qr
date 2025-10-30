<!-- src/components/auth/RegisterRoleSelect.vue -->
<!-- -------------------------------------------------------------
 Sélection du rôle à l’inscription
---------------------------------------------------------------
📌 Description :
 - Choix entre deux rôles : Freelance ou Client
--------------------------------------------------------------- -->

<template>
  <div class="flex flex-col items-center gap-4">
    <p class="text-gray-600 mb-4">Je suis...</p>

    <button
      class="w-64 border rounded-xl p-4 hover:bg-gray-50 transition"
      @click="$emit('select', 'freelance')"
    >
      👤 Un extra (je cherche des missions)
    </button>

    <button
      class="w-64 border rounded-xl p-4 hover:bg-gray-50 transition"
      @click="$emit('select', 'client')"
    >
      🏢 Un recruteur (je cherche du personnel)
    </button>
  </div>
</template>
