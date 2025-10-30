// src/composables/agenda/useAgendaSelection.ts
// -------------------------------------------------------------
// Composable : Gestion de la sélection fluide dans l’agenda
// -------------------------------------------------------------
//
// 📌 Description :
//   - Gère le “ghost slot” temporaire (bloc rouge semi-transparent)
//   - Centralise la logique de création de slots (admin) et missions (client)
//   - Synchronise l’ouverture du popup de sélection (SelectionPopup ou ClientPopup)
//
// 📍 Comportement :
//   - Clic + drag → crée un ghost slot dans AgendaDayColumn.vue
//   - À la fin du drag, le composable reçoit un event “createSlot”
//   - Ouvre le popup (admin = SelectionPopup / client = ClientPopup)
//
// 🔒 Règles d’accès :
//   - Lecture publique : autorisée
//   - Création : déclenchée uniquement pour les admins
//
// ⚠️ Remarques :
//   - Ce composable ne s’occupe plus du dessin du ghost slot (géré dans le composant)
//   - Il ne manipule plus directement la grille horaire : il écoute seulement les événements
// -------------------------------------------------------------

import { ref } from "vue";

export function useAgendaSelection() {
  // -------------------------------------------------------------
  // 🧭 État réactif
  // -------------------------------------------------------------
  /**
   * - currentSelection → plage horaire courante (date + heure début/fin)
   * - showPopup → ouverture du popup (SelectionPopup / ClientPopup)
   * - isDragging → indicateur visuel global (utile si on veut bloquer d’autres interactions)
   */
  const currentSelection = ref<{
    date: string;
    start: string;
    end: string;
  } | null>(null);

  const showPopup = ref(false);
  const isDragging = ref(false);

  // -------------------------------------------------------------
  // 🧩 Gestion de la création de slot (depuis AgendaDayColumn)
  // -------------------------------------------------------------
  /**
   * Reçoit la plage horaire émise par `AgendaDayColumn` via `emit('createSlot')`
   * @param range { date: string; start: string; end: string }
   */
  function handleCreateSlot(range: {
    date: string;
    start: string;
    end: string;
  }) {
    // 🔸 Exemple : { date: '2025-10-06', start: '14:00', end: '15:15' }
    currentSelection.value = range;
    showPopup.value = true;
  }

  // -------------------------------------------------------------
  // 🧠 Handlers popup
  // -------------------------------------------------------------
  function handleCancel() {
    showPopup.value = false;
    currentSelection.value = null;
  }

  function handleClientMission(mission: unknown) {
    console.log("✅ Mission créée par client :", mission);
    showPopup.value = false;
    currentSelection.value = null;
  }

  // -------------------------------------------------------------
  // 🧱 Retour public du composable
  // -------------------------------------------------------------
  return {
    // état global
    isDragging,
    currentSelection,
    showPopup,

    // handlers
    handleCreateSlot,
    handleCancel,
    handleClientMission,
  };
}
