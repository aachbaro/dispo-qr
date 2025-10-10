// src/composables/useUnavailabilities.ts
// -------------------------------------------------------------
// Composable : useUnavailabilities
// -------------------------------------------------------------
//
// 📌 Description :
//   - Gère l’état réactif des indisponibilités (ponctuelles ou récurrentes)
//   - Fournit des actions CRUD simples pour le frontend
//   - S’intègre avec l’agenda (chargement par période)
//
// 📍 Fonctions :
//   - loadUnavailabilities(start, end)
//   - addUnavailability(payload)
//   - editUnavailability(id, payload)
//   - removeUnavailability(id)
//
// 🔒 Accès :
//   - Réservé à l’entreprise (owner/admin)
//
// -------------------------------------------------------------

import { ref } from "vue";
import {
  getUnavailabilities,
  createUnavailability,
  updateUnavailability,
  deleteUnavailability,
  type Unavailability,
} from "../services/unavailabilities";

// ----------------------
// State global réactif
// ----------------------
const unavailabilities = ref<Unavailability[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

// ----------------------
// Composable principal
// ----------------------
export function useUnavailabilities(slug: string) {
  // Charger les indisponibilités pour une période donnée
  async function loadUnavailabilities(start: string, end: string) {
    try {
      loading.value = true;
      error.value = null;
      const data = await getUnavailabilities(slug, start, end);
      unavailabilities.value = data;
    } catch (err: any) {
      console.error("❌ loadUnavailabilities:", err);
      error.value = err.message || "Erreur lors du chargement";
    } finally {
      loading.value = false;
    }
  }

  // Créer une nouvelle indisponibilité
  async function addUnavailability(payload: Partial<Unavailability>) {
    try {
      const { unavailability } = await createUnavailability(slug, payload);
      unavailabilities.value.push(unavailability);
      return unavailability;
    } catch (err: any) {
      console.error("❌ addUnavailability:", err);
      throw err;
    }
  }

  // Mettre à jour une indisponibilité
  async function editUnavailability(
    id: number,
    payload: Partial<Unavailability>
  ) {
    try {
      const updated = await updateUnavailability(slug, id, payload);
      const idx = unavailabilities.value.findIndex((u) => u.id === id);
      if (idx !== -1) unavailabilities.value[idx] = updated;
      return updated;
    } catch (err: any) {
      console.error("❌ editUnavailability:", err);
      throw err;
    }
  }

  // Supprimer une indisponibilité
  async function removeUnavailability(id: number) {
    try {
      await deleteUnavailability(slug, id);
      unavailabilities.value = unavailabilities.value.filter(
        (u) => u.id !== id
      );
    } catch (err: any) {
      console.error("❌ removeUnavailability:", err);
      throw err;
    }
  }

  return {
    unavailabilities,
    loading,
    error,
    loadUnavailabilities,
    addUnavailability,
    editUnavailability,
    removeUnavailability,
  };
}
