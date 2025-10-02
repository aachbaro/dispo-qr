<!-- src/pages/Home.vue -->
<!-- -------------------------------------------------------------
 Page d’accueil (Home)
---------------------------------------------------------------
📌 Description :
 - Page publique d’entrée sur la plateforme
 - Présente le concept, les profils cibles et les CTA principaux

🔒 Règles d’accès :
 - Accessible à tous (aucune auth requise)

⚠️ Remarques :
 - CTA “Je cherche un extra” → redirige vers inscription restaurateur
 - CTA “Je suis extra” → redirige vers inscription freelance
--------------------------------------------------------------- -->

<template>
  <div class="max-w-5xl mx-auto p-6 space-y-16">
    <!-- Hero Section -->
    <section class="text-center space-y-6">
      <h1 class="text-4xl font-bold text-gray-900">
        La plateforme des extras en restauration
      </h1>
      <p class="text-lg text-gray-600">
        Gérez vos missions, disponibilités et factures en toute simplicité.
      </p>
      <div class="flex justify-center gap-4">
        <button
          @click="goToRegister('restaurateur')"
          class="px-6 py-3 rounded-lg bg-yellow-500 text-white font-semibold hover:bg-yellow-600 transition"
        >
          👨‍🍳 Je cherche un extra
        </button>
        <button
          @click="goToRegister('freelance')"
          class="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
        >
          🍴 Je suis extra
        </button>
      </div>
    </section>

    <section>
      <EntrepriseSearch />
    </section>

    <!-- Fonctionnement -->
    <section>
      <h2 class="text-2xl font-bold mb-6 text-center">Comment ça marche ?</h2>
      <div class="grid md:grid-cols-4 gap-6 text-center">
        <div>
          <div class="text-4xl mb-2">📅</div>
          <p>L’extra publie ses disponibilités</p>
        </div>
        <div>
          <div class="text-4xl mb-2">📩</div>
          <p>Le restaurateur envoie une demande</p>
        </div>
        <div>
          <div class="text-4xl mb-2">✅</div>
          <p>L’extra accepte ou refuse</p>
        </div>
        <div>
          <div class="text-4xl mb-2">🧾</div>
          <p>Facture ou contrat généré automatiquement</p>
        </div>
      </div>
    </section>

    <!-- Avantages -->
    <section class="grid md:grid-cols-2 gap-8">
      <div class="p-6 border rounded-lg shadow-sm bg-white">
        <h3 class="font-semibold text-lg mb-4">Pour les restaurateurs</h3>
        <ul class="space-y-2 list-disc list-inside text-gray-700">
          <li>Trouvez rapidement des extras disponibles</li>
          <li>Suivi des missions et factures au même endroit</li>
          <li>Recherche par compétences (chef de rang, commis…)</li>
        </ul>
      </div>
      <div class="p-6 border rounded-lg shadow-sm bg-white">
        <h3 class="font-semibold text-lg mb-4">Pour les extras</h3>
        <ul class="space-y-2 list-disc list-inside text-gray-700">
          <li>Agenda centralisé</li>
          <li>Devis et factures générés automatiquement</li>
          <li>Période d’essai gratuite</li>
          <li>Profil mis en avant auprès des restaurateurs</li>
        </ul>
      </div>
    </section>

    <!-- Abonnements -->
    <section>
      <h2 class="text-2xl font-bold mb-6 text-center">Nos abonnements</h2>
      <div class="grid md:grid-cols-2 gap-6">
        <div class="p-6 border rounded-lg bg-gray-50 text-center">
          <h3 class="text-xl font-semibold mb-2">Freelance (extra)</h3>
          <p class="text-3xl font-bold">4€ / mois</p>
          <p class="text-gray-600">ou 25€ / an</p>
          <p class="text-sm text-gray-500 mt-2">1 à 3 mois d’essai gratuit</p>
          <button
            @click="goToRegister('freelance')"
            class="mt-4 px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Commencer gratuitement
          </button>
        </div>
        <div class="p-6 border rounded-lg bg-gray-50 text-center">
          <h3 class="text-xl font-semibold mb-2">Restaurateur</h3>
          <p class="text-3xl font-bold">Gratuit</p>
          <p class="text-gray-600">Fonctionnalités de base incluses</p>
          <button
            @click="goToRegister('restaurateur')"
            class="mt-4 px-4 py-2 rounded bg-yellow-500 text-white hover:bg-yellow-600"
          >
            Commencer gratuitement
          </button>
        </div>
      </div>
    </section>

    <!-- Exemples -->
    <section>
      <h2 class="text-2xl font-bold mb-6 text-center">
        Aperçu de la plateforme
      </h2>
      <div class="grid md:grid-cols-3 gap-6 text-center">
        <div class="p-4 border rounded bg-white">📅 Exemple agenda</div>
        <div class="p-4 border rounded bg-white">📝 Exemple mission</div>
        <div class="p-4 border rounded bg-white">💳 Exemple facture</div>
      </div>
    </section>

    <!-- FAQ -->
    <section>
      <h2 class="text-2xl font-bold mb-6 text-center">FAQ</h2>
      <div class="space-y-4">
        <details class="p-4 border rounded bg-white">
          <summary class="font-semibold">
            Est-ce gratuit pour les restaurateurs ?
          </summary>
          <p class="mt-2 text-gray-600">
            Oui, l’inscription est gratuite et donne accès aux fonctionnalités
            de base.
          </p>
        </details>
        <details class="p-4 border rounded bg-white">
          <summary class="font-semibold">
            Comment se passe le paiement ?
          </summary>
          <p class="mt-2 text-gray-600">
            Les restaurateurs paient en ligne via un lien sécurisé. La facture
            est générée automatiquement.
          </p>
        </details>
        <details class="p-4 border rounded bg-white">
          <summary class="font-semibold">
            Et si je n’ai pas de micro-entreprise ?
          </summary>
          <p class="mt-2 text-gray-600">
            Vous pouvez tout de même créer un profil et tester la plateforme en
            période d’essai.
          </p>
        </details>
      </div>
    </section>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import EntrepriseSearch from "../components/EntrepriseSearch.vue";

const router = useRouter();

function goToRegister(role) {
  router.push(`/register?role=${role}`);
}
</script>
