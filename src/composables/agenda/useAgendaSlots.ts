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
//   - Affiche les indisponibilités en fond gris transparent
//   - Les heures sont basées sur une journée de 07h à 24h
// -------------------------------------------------------------

import { ref, watch, computed, type Ref} from "vue";
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
// Composable principal
// -------------------------------------------------------------
export function useAgendaSlots(
  slug: string,
  isAdmin: boolean,
  activeWeek: Ref<Date>
) {
  // -------------------------------------------------------------
  // 🧭 État
  // -------------------------------------------------------------
  const slots = ref<Slot[]>([]);
  const loading = ref(false);

  // ✅ on passe maintenant le slug ici
  const { unavailabilities, loadUnavailabilities } = useUnavailabilities(slug);

  // -------------------------------------------------------------
  // 🧰 Utils internes
  // -------------------------------------------------------------
  function toLocalIso(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${y}-${m}-${da}T${hh}:${mm}:${ss}`;
  }

  function ymdLocal(d: Date): string {
    return d.toLocaleDateString("fr-CA"); // YYYY-MM-DD
  }

  function weekBounds(mondayLikeDate: Date) {
    const start = new Date(mondayLikeDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { from: start.toISOString(), to: end.toISOString() };
  }

  // -------------------------------------------------------------
  // 📦 Fetch (slots + indispos)
  // -------------------------------------------------------------
  async function fetchCurrentWeek() {
    if (!slug) return;
    loading.value = true;
    try {
      const { from, to } = weekBounds(activeWeek.value);

      const [{ slots: slotData }] = await Promise.all([
        getEntrepriseSlots(slug, { from, to }),
        loadUnavailabilities(from, to),
      ]);

      // ✅ Tri des slots par date de début pour cohérence
      slots.value = slotData.sort(
        (a, b) => new Date(a.start!).getTime() - new Date(b.start!).getTime()
      );
    } catch (err) {
      console.error("❌ Erreur fetch slots/unavailabilities:", err);
    } finally {
      loading.value = false;
    }
  }

  watch(activeWeek, fetchCurrentWeek, { immediate: true });

  // -------------------------------------------------------------
  // ✏️ CRUD Slots
  // -------------------------------------------------------------
  async function addSlot(start: string, end: string, title: string) {
    if (!isAdmin) return;
    try {
      const { slot } = await createEntrepriseSlot(slug, { start, end, title });
      slots.value.push(slot);
      slots.value.sort(
        (a, b) => new Date(a.start!).getTime() - new Date(b.start!).getTime()
      );
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
    slots.value.push(slot);
  }

  // -------------------------------------------------------------
  // 🧲 Déplacement vertical (drag & drop)
  // -------------------------------------------------------------
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
  function slotStyle(slot: Slot | Unavailability) {
    const start = new Date(
      slot.start || `${slot.start_date}T${slot.start_time}`
    );
    const end = new Date(slot.end || `${slot.start_date}T${slot.end_time}`);

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

    if (heightMin <= 0) return { display: "none" };

    const topPct = (topMin / totalMin) * 100;
    const heightPct = (heightMin / totalMin) * 100;

    return {
      top: `${topPct}%`,
      height: `${heightPct}%`,
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
  const allSlots = computed(() => {
    const slotEvents = slots.value.map((s) => ({
      ...s,
      type: "slot",
      color: "#2563eb",
    }));

    const unavEvents = unavailabilities.value.map((u) => ({
      id: `unav-${u.id}`,
      title: u.title || "Indisponible",
      start: `${u.start_date}T${u.start_time}`,
      end: `${u.start_date}T${u.end_time}`,
      type: "unavailability",
      color: "#9ca3af",
    }));

    return [...slotEvents, ...unavEvents];
  });

  function daySlots(date: string) {
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
