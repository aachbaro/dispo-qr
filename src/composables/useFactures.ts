// src/composables/useFactures.ts
// -------------------------------------------------------------
// Composable de gestion des factures
// -------------------------------------------------------------
//
// - Centralise les appels à src/services/factures.ts
// - Fournit un état réactif (factures, loading, error)
// - Utilisé dans les composants (FactureList, FactureModal, etc.)
//
// -------------------------------------------------------------

import { ref } from "vue";
import {
  listEntrepriseFactures,
  createEntrepriseFacture,
  updateEntrepriseFacture,
  deleteEntrepriseFacture,
  type Facture,
  type FacturePayload,
  type FactureUpdate,
} from "../services/factures";

export function useFactures() {
  const factures = ref<Facture[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // ----------------------
  // Lister les factures
  // ----------------------
  async function fetchFactures(refEntreprise: string | number) {
    loading.value = true;
    error.value = null;
    try {
      const { factures: data } = await listEntrepriseFactures(refEntreprise);
      factures.value = data;
    } catch (err: any) {
      console.error("❌ Erreur fetch factures:", err);
      error.value = err.message || "Impossible de récupérer les factures";
    } finally {
      loading.value = false;
    }
  }

  // ----------------------
  // Créer une facture
  // ----------------------
  async function createFacture(
    refEntreprise: string | number,
    payload: FacturePayload
  ) {
    loading.value = true;
    error.value = null;
    try {
      const { facture } = await createEntrepriseFacture(refEntreprise, payload);
      factures.value.unshift(facture); // ajoute en tête
      return facture;
    } catch (err: any) {
      console.error("❌ Erreur création facture:", err);
      error.value = err.message || "Impossible de créer la facture";
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // ----------------------
  // Mettre à jour une facture
  // ----------------------
  async function updateFacture(
    refEntreprise: string | number,
    factureId: number,
    updates: FactureUpdate
  ) {
    loading.value = true;
    error.value = null;
    try {
      const { facture } = await updateEntrepriseFacture(
        refEntreprise,
        factureId,
        updates
      );
      const idx = factures.value.findIndex((f) => f.id === facture.id);
      if (idx !== -1) factures.value[idx] = facture;
      return facture;
    } catch (err: any) {
      console.error("❌ Erreur update facture:", err);
      error.value = err.message || "Impossible de mettre à jour la facture";
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // ----------------------
  // Supprimer une facture
  // ----------------------
  async function removeFacture(
    refEntreprise: string | number,
    factureId: number
  ) {
    loading.value = true;
    error.value = null;
    try {
      await deleteEntrepriseFacture(refEntreprise, factureId);
      factures.value = factures.value.filter((f) => f.id !== factureId);
    } catch (err: any) {
      console.error("❌ Erreur suppression facture:", err);
      error.value = err.message || "Impossible de supprimer la facture";
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    factures,
    loading,
    error,
    fetchFactures,
    createFacture,
    updateFacture,
    removeFacture,
  };
}
