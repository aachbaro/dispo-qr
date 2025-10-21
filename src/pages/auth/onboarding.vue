<!-- src/pages/auth/onboarding.vue -->
<!-- -------------------------------------------------------------
 Page d’onboarding après connexion Google / Magic Link
---------------------------------------------------------------
📌 Description :
 - Permet à l’utilisateur de compléter son profil après un login OAuth/Magic Link
 - Renseigne le rôle (freelance ou client) et les infos de base (first_name, last_name, phone)
 - Met à jour la table `profiles` via PUT /api/profiles/me
 - Si role = freelance → l’entreprise est créée automatiquement (backend)

🔒 Règles d’accès :
 - Auth obligatoire (token Supabase valide)
 - Appel automatique après callback si profil incomplet

⚙️ Remarques :
 - Utilise useAuth pour maintenir l’état global
 - Rafraîchit la session Supabase pour que le JWT contienne les métadonnées à jour
 - Redirige ensuite vers :
     • /entreprise/[slug]  → freelance
     • /client             → client
--------------------------------------------------------------- -->

<template>
  <div class="max-w-md mx-auto p-6 space-y-4">
    <h1 class="text-2xl font-bold mb-4">Welcome to ExtraBeam</h1>
    <p class="text-gray-600 mb-6">
      Complete these few details to finish setting up your account.
    </p>

    <form @submit.prevent="handleSubmit" class="space-y-3">
      <!-- Role -->
      <select v-model="role" class="input" required>
        <option value="">Select your role</option>
        <option value="freelance">I’m an extra</option>
        <option value="client">I’m a restaurant owner</option>
      </select>

      <!-- Basic info -->
      <input
        v-model="first_name"
        placeholder="First name"
        class="input"
        required
      />
      <input
        v-model="last_name"
        placeholder="Last name"
        class="input"
        required
      />
      <input
        v-model="phone"
        placeholder="Phone (optional)"
        class="input"
        type="tel"
      />

      <!-- Submit -->
      <button type="submit" class="btn-primary w-full" :disabled="loading">
        {{ loading ? "Saving..." : "Continue" }}
      </button>
    </form>

    <p v-if="error" class="text-red-500 text-sm mt-2">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "@/composables/useAuth";
import { supabase } from "@/services/supabase";

const router = useRouter();
const { user, initAuth, setUser } = useAuth();

const role = ref("");
const first_name = ref("");
const last_name = ref("");
const phone = ref("");
const error = ref("");
const loading = ref(false);

async function handleSubmit() {
  try {
    loading.value = true;
    error.value = "";

    // 🔐 Vérifie session
    if (!user.value) await initAuth();
    const token = localStorage.getItem("authToken");
    if (!token) throw new Error("Session expired, please log in again.");

    // 🔹 Update profile via API
    const res = await fetch("/api/profiles/me", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        role: role.value,
        first_name: first_name.value,
        last_name: last_name.value,
        phone: phone.value,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Profile update failed");
    }

    const { profile } = await res.json();
    if (!profile) throw new Error("Profile update failed (empty response)");
    console.log("✅ Profile updated:", profile);

    // 🔄 Met à jour l’état local (avant refresh)
    setUser({
      ...user.value,
      role: profile.role ?? user.value.role,
      first_name: profile.first_name ?? user.value.first_name,
      last_name: profile.last_name ?? user.value.last_name,
      phone: profile.phone ?? user.value.phone,
      slug: profile.slug ?? user.value.slug,
    });

    // 🔑 Refresh Supabase session pour que le JWT contienne les métadonnées à jour
    const { error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError)
      console.warn("⚠️ Session refresh failed:", refreshError.message);

    // 🌀 Recharge le user complet depuis Supabase
    await initAuth();

    // 🧭 Redirection selon le rôle
    if (role.value === "freelance") {
      router.push(`/entreprise/${user.value?.slug ?? ""}`);
    } else {
      router.push("/client");
    }
  } catch (err: any) {
    error.value = err.message || "An unexpected error occurred.";
    console.error("❌ Onboarding error:", err);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.input {
  @apply w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-black;
}
.btn-primary {
  @apply bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50;
}
</style>
