<!-- src/pages/auth/callback.vue -->
<!-- -------------------------------------------------------------
 Page de callback OAuth / Magic Link
---------------------------------------------------------------
📌 Description :
 - Appelée automatiquement après une connexion via Google ou lien magique
 - Récupère la session Supabase et initialise l’état global (useAuth)
 - Redirige ensuite selon le rôle de l’utilisateur :
     • client     → /client
     • freelance  → /entreprise/[slug]
     • admin      → /admin
     • profil incomplet → /auth/onboarding

🔒 Règles d’accès :
 - Publique (Supabase gère l’auth côté serveur)

⚠️ Remarques :
 - Doit correspondre à redirectTo défini dans useAuth/loginGoogle/loginMagicLink
 - Fonctionne pour tous les modes : Google, Magic Link, Email
--------------------------------------------------------------- -->

<template>
  <div class="min-h-screen flex flex-col items-center justify-center">
    <p class="text-gray-600 mb-3">Connexion en cours...</p>
    <p class="text-sm text-gray-400">Merci de patienter quelques secondes</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "@/composables/useAuth";

const router = useRouter();
const { initAuth, user } = useAuth();

onMounted(async () => {
  try {
    // 🔄 Initialise la session Supabase et récupère le user
    await initAuth();

    if (!user.value) {
      console.warn("❌ Aucun utilisateur détecté après callback.");
      return router.replace("/register");
    }

    const role = user.value.role;
    const slug = user.value.slug;

    // 🧩 Cas 1 : profil incomplet → redirection vers onboarding
    if (!role || (role === "freelance" && !slug)) {
      console.log("🧠 Profil incomplet → redirection vers onboarding");
      return router.replace("/auth/onboarding");
    }

    // 🧭 Cas 2 : rôle détecté → redirection spécifique
    switch (role) {
      case "freelance":
        router.replace(`/entreprise/${slug}`);
        break;
      case "client":
        router.replace("/client");
        break;
      case "admin":
        router.replace("/admin");
        break;
      default:
        router.replace("/");
        break;
    }
  } catch (err) {
    console.error("❌ Erreur callback auth:", err);
    router.replace("/register");
  }
});
</script>
