// src/composables/agenda/useAgendaSlots.ts
// -------------------------------------------------------------
// Composable : Gestion des slots et indisponibilités
// -------------------------------------------------------------
//
// 📌 Description :
//   - Centralise la logique CRUD des créneaux horaires d’une entreprise
//   - Gère aussi l’affichage des indisponibilités récurrentes (unavailabilities)
//   - Fournit les helpers d’affichage et positionnement dans la grille
//   - Intègre la mise à jour en drag & drop vertical (`moveSlot`)
//
// 📍 Fonctions principales :
//   - fetchCurrentWeek() → charge les slots + indispos de la semaine courante
//   - addSlot() → création d’un slot (popup ou bouton +)
//   - editSlot() → mise à jour d’un slot existant
//   - removeSlot() → suppression d’un slot
//   - moveSlot() → déplacement vertical (snap 15min)
//   - daySlots() → fusionne slots + indispos par jour
//   - slotStyle() → calcule position/hauteur
//
// 🔒 Règles d’accès :
//   - Lecture publique (GET slots)
//   - Écriture réservée à l’owner/admin
//
// ⚠️ Remarques :
//   - En mode `overview` (disableAutoFetch = true), aucune requête réseau
//     n’est lancée : on se base sur les données injectées côté frontend.
// -------------------------------------------------------------

import { ref, watch, computed, type Ref } from "vue";
import {
  getEntrepriseSlots,
  createEntrepriseSlot,
  updateEntrepriseSlot,
  deleteEntrepriseSlot,
  type Slot,
} from "../../services/slots";
import { useUnavailabilities } from "../useUnavailabilities";
import type { Unavailability } from "../../services/unavailabilities";

// -------------------------------------------------------------
// Types & Interfaces
// -------------------------------------------------------------
export type AgendaDisplaySlot =
  | (Slot & { start: string; end: string; type: "slot"; color: string })
  | (Unavailability & {
      start: string;
      end: string;
      type: "unavailability";
      color: string;
    });

type AgendaSlotsOptions = {
  initialSlots?: Slot[];
  initialUnavailabilities?: Unavailability[];
  disableAutoFetch?: boolean;
};

// -------------------------------------------------------------
// Composable principal
// -------------------------------------------------------------
export function useAgendaSlots(
  slug: string,
  isAdmin: boolean,
  activeWeek: Ref<Date>,
  options: AgendaSlotsOptions = {}
) {
  // -------------------------------------------------------------
  // 🧭 État local
  // -------------------------------------------------------------
  const slots = ref<Slot[]>([]);
  const loading = ref(false);
  const shouldAutoFetch = !options.disableAutoFetch;

  const { unavailabilities, loadUnavailabilities, setUnavailabilities } =
    useUnavailabilities(slug, options.initialUnavailabilities);

  // -------------------------------------------------------------
  // 🧰 Helpers
  // -------------------------------------------------------------
  function sortSlotsList(list: Slot[]) {
    return [...list].sort(
      (a, b) => new Date(a.start!).getTime() - new Date(b.start!).getTime()
    );
  }

  function weekBounds(mondayLikeDate: Date) {
    const start = new Date(mondayLikeDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { from: start.toISOString(), to: end.toISOString() };
  }

  // -------------------------------------------------------------
  // 🧩 Initialisation
  // -------------------------------------------------------------
  if (options.initialSlots) {
    slots.value = sortSlotsList(options.initialSlots);
  }
  if (options.initialUnavailabilities) {
    setUnavailabilities(options.initialUnavailabilities);
  }

  // -------------------------------------------------------------
  // 📦 Fetch (slots + indispos)
  // -------------------------------------------------------------
  async function fetchCurrentWeek() {
    if (!slug || !shouldAutoFetch) return; // 👈 évite tout fetch inutile
    loading.value = true;

    try {
      const { from, to } = weekBounds(activeWeek.value);
      const [{ slots: slotData }] = await Promise.all([
        getEntrepriseSlots(slug, { from, to }),
        loadUnavailabilities(from, to),
      ]);

      slots.value = sortSlotsList(slotData);
    } catch (err) {
      console.error("❌ Erreur fetch slots/unavailabilities:", err);
    } finally {
      loading.value = false;
    }
  }

  // -------------------------------------------------------------
  // 🔄 Auto-fetch (désactivé en mode overview)
  // -------------------------------------------------------------
  if (shouldAutoFetch) {
    watch(activeWeek, fetchCurrentWeek, { immediate: true });
  } else {
    console.log(
      "🧠 useAgendaSlots: autoFetch désactivé → données injectées utilisées."
    );
  }

  // -------------------------------------------------------------
  // ✏️ CRUD Slots
  // -------------------------------------------------------------
  async function addSlot(start: string, end: string, title: string) {
    if (!isAdmin) return;
    try {
      const { slot } = await createEntrepriseSlot(slug, { start, end, title });
      slots.value = sortSlotsList([...slots.value, slot]);
    } catch (err) {
      console.error("❌ Erreur création slot:", err);
    }
  }

  async function editSlot(id: number, updates: Partial<Slot>) {
    if (!isAdmin) return;
    try {
      const { slot } = await updateEntrepriseSlot(slug, id, updates);
      slots.value = slots.value.map((s) => (s.id === id ? slot : s));
    } catch (err) {
      console.error("❌ Erreur mise à jour slot:", err);
    }
  }

  async function removeSlot(id: number) {
    if (!isAdmin) return;
    try {
      await deleteEntrepriseSlot(slug, id);
      slots.value = slots.value.filter((s) => s.id !== id);
    } catch (err) {
      console.error("❌ Erreur suppression slot:", err);
    }
  }

  function handleSlotCreated(slot: Slot) {
    slots.value = sortSlotsList([...slots.value, slot]);
  }

  async function moveSlot(payload: {
    id: number;
    newStart: string;
    newEnd: string;
  }) {
    if (!isAdmin) return;
    const { id, newStart, newEnd } = payload;
    try {
      const { slot } = await updateEntrepriseSlot(slug, id, {
        start: newStart,
        end: newEnd,
      });
      slots.value = slots.value.map((s) => (s.id === id ? slot : s));
    } catch (err) {
      console.error("❌ Erreur déplacement slot:", err);
    }
  }

  // -------------------------------------------------------------
  // 🖼️ Helpers d’affichage
  // -------------------------------------------------------------
  function slotStyle(slot: AgendaDisplaySlot | { start: string; end: string }) {
    const hasDateInfo = "start_date" in slot;
    const start = new Date(
      hasDateInfo ? `${slot.start_date}T${slot.start_time}` : slot.start
    );
    const end = new Date(
      hasDateInfo ? `${slot.start_date}T${slot.end_time}` : slot.end
    );

    const dayStart = new Date(start);
    dayStart.setHours(7, 0, 0, 0);
    const dayEnd = new Date(start);
    dayEnd.setHours(24, 0, 0, 0);

    const s = new Date(Math.max(start.getTime(), dayStart.getTime()));
    const e = new Date(Math.min(end.getTime(), dayEnd.getTime()));

    const totalMin = (dayEnd.getTime() - dayStart.getTime()) / 60000;
    const topMin = Math.max(0, (s.getTime() - dayStart.getTime()) / 60000);
    const endMin = Math.max(0, (e.getTime() - dayStart.getTime()) / 60000);
    const heightMin = Math.max(0, endMin - topMin);

    if (heightMin <= 0) return { display: "none", top: "0%", height: "0%" };

    const topPct = (topMin / totalMin) * 100;
    const heightPct = (heightMin / totalMin) * 100;

    return {
      top: `${topPct}%`,
      height: `${heightPct}%`,
      display: "block",
    };
  }

  function formatHour(dateString: string) {
    return new Date(dateString).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // -------------------------------------------------------------
  // 🧩 Fusion slots + unavailabilities
  // -------------------------------------------------------------
  const allSlots = computed<AgendaDisplaySlot[]>(() => {
    const slotEvents = slots.value
      .filter(
        (s): s is Slot & { start: string; end: string } =>
          typeof s.start === "string" && typeof s.end === "string"
      )
      .map((s) => ({
        ...s,
        type: "slot" as const,
        color: "#2563eb",
      }));

    const { from } = weekBounds(activeWeek.value);
    const monday = new Date(from); // début de la semaine affichée

    const unavEvents = unavailabilities.value.flatMap((u) => {
      if (u.recurrence_type !== "weekly" || !u.weekday) {
        return [
          {
            ...u,
            start: `${u.start_date}T${u.start_time}`,
            end: `${u.start_date}T${u.end_time}`,
            type: "unavailability" as const,
            color: "#9ca3af",
          },
        ];
      }

      // Calcule la date réelle dans la semaine courante
      const occurrence = new Date(monday);
      occurrence.setDate(monday.getDate() + (u.weekday - 1));

      // ✅ ISO local sans décalage UTC
      const isoDate = occurrence.toLocaleDateString("fr-CA");

      // Exceptions et fin de récurrence
      if (u.exceptions?.includes(isoDate)) return [];
      if (u.recurrence_end && isoDate > u.recurrence_end) return [];

      return [
        {
          ...u,
          start: `${isoDate}T${u.start_time}`,
          end: `${isoDate}T${u.end_time}`,
          type: "unavailability" as const,
          color: "#9ca3af",
        },
      ];
    });

    return [...slotEvents, ...unavEvents];
  });

  function daySlots(date: string): AgendaDisplaySlot[] {
    return allSlots.value.filter(
      (s) => typeof s.start === "string" && s.start.startsWith(date)
    );
  }

  // -------------------------------------------------------------
  // ✅ Export du composable
  // -------------------------------------------------------------
  return {
    slots,
    loading,
    fetchCurrentWeek,
    setSlots: (data: Slot[]) => {
      slots.value = sortSlotsList(data);
    },
    setUnavailabilities,

    // CRUD
    addSlot,
    editSlot,
    removeSlot,
    handleSlotCreated,
    moveSlot,

    // Display
    daySlots,
    slotStyle,
    formatHour,
  };
}
