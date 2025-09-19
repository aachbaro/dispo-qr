// src/composables/agenda/useAgendaSelection.ts
import { ref } from "vue";

export function useAgendaSelection() {
  /**
   * State
   */
  const isDragging = ref(false);
  const selectionStart = ref<{ date: string; hour: string } | null>(null);
  const selectionEnd = ref<{ date: string; hour: string } | null>(null);

  const selectedSlots = ref<{ date: string; hour: string }[]>([]);
  const currentSelection = ref<{
    date: string;
    start: string;
    end: string;
  } | null>(null);

  const showPopup = ref(false);

  /**
   * Utils
   */
  function buildSelectionRange(
    start: { date: string; hour: string },
    end: { date: string; hour: string }
  ) {
    const hoursList = [
      ...Array.from(
        { length: 17 },
        (_, i) => `${String(i + 7).padStart(2, "0")}:00`
      ),
      "00:00",
      "01:00",
      "02:00",
    ];

    const startIndex = hoursList.indexOf(start.hour);
    const endIndex = hoursList.indexOf(end.hour);

    const [min, max] = [
      Math.min(startIndex, endIndex),
      Math.max(startIndex, endIndex),
    ];

    return hoursList.slice(min, max + 1).map((h) => ({
      date: start.date,
      hour: h,
    }));
  }

  /**
   * Selection events
   */
  function startSelection(date: string, hour: string) {
    isDragging.value = true;
    selectionStart.value = { date, hour };
    selectionEnd.value = { date, hour };
  }

  function extendSelection(date: string, hour: string) {
    if (isDragging.value && selectionStart.value?.date === date) {
      selectionEnd.value = { date, hour };
    }
  }

  function endSelection() {
    if (isDragging.value && selectionStart.value && selectionEnd.value) {
      const slots = buildSelectionRange(
        selectionStart.value,
        selectionEnd.value
      );
      const startHour = slots[0].hour;
      const endHour = slots[slots.length - 1].hour;
      const date = selectionStart.value.date;

      currentSelection.value = { date, start: startHour, end: endHour };
      showPopup.value = true; // 👈 déclenche l’ouverture du popup (admin ou client selon Agenda.vue)
    }

    isDragging.value = false;
    selectionStart.value = null;
    selectionEnd.value = null;
  }

  function isSelected(date: string, hour: string) {
    if (isDragging.value && selectionStart.value?.date === date) {
      const tempSlots = buildSelectionRange(
        selectionStart.value,
        selectionEnd.value || selectionStart.value
      );
      return tempSlots.some((s) => s.date === date && s.hour === hour);
    }
    return selectedSlots.value.some((s) => s.date === date && s.hour === hour);
  }

  /**
   * Popup handlers
   */
  function handleCancel() {
    showPopup.value = false;
    currentSelection.value = null;
  }

  function handleClientMission(mission: unknown) {
    console.log("✅ Mission created by client:", mission);
    showPopup.value = false;
    currentSelection.value = null;
  }

  return {
    // state
    isDragging,
    currentSelection,
    showPopup,

    // events
    startSelection,
    extendSelection,
    endSelection,
    isSelected,

    // popup
    handleCancel,
    handleClientMission,
  };
}
