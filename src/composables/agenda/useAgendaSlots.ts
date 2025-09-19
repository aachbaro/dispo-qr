// src/composables/agenda/useAgendaSlots.ts
import { ref, watch } from "vue";
import {
  getEntrepriseSlots,
  createEntrepriseSlot,
  updateEntrepriseSlot,
  deleteEntrepriseSlot,
  type Slot,
} from "../../services/slots";
import { useAgendaNavigation } from "./useAgendaNavigation";

export function useAgendaSlots(slug: string, isAdmin: boolean) {
  /**
   * State
   */
  const slots = ref<Slot[]>([]);
  const loading = ref(false);

  const { activeWeek } = useAgendaNavigation();

  /**
   * Utils
   */
  function toLocalIso(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${y}-${m}-${da}T${hh}:${mm}:${ss}`; // no Z → local
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

  /**
   * Fetch
   */
  async function fetchCurrentWeek() {
    if (!slug) return;
    loading.value = true;
    try {
      const { from, to } = weekBounds(activeWeek.value);
      const { slots: data } = await getEntrepriseSlots(slug, { from, to });
      slots.value = data;
    } catch (err) {
      console.error("❌ Error fetching slots:", err);
    } finally {
      loading.value = false;
    }
  }

  watch(activeWeek, fetchCurrentWeek, { immediate: true });

  /**
   * CRUD
   */
  async function addSlot(start: string, end: string, title: string) {
    if (!isAdmin) return;
    try {
      const { slot } = await createEntrepriseSlot(slug, { start, end, title });
      slots.value.push(slot);
    } catch (err) {
      console.error("❌ Error creating slot:", err);
    }
  }

  async function editSlot(id: number, updates: Partial<Slot>) {
    if (!isAdmin) return;
    try {
      const { slot } = await updateEntrepriseSlot(slug, id, updates);
      slots.value = slots.value.map((s) => (s.id === id ? slot : s));
    } catch (err) {
      console.error("❌ Error updating slot:", err);
    }
  }

  async function removeSlot(id: number) {
    if (!isAdmin) return;
    try {
      await deleteEntrepriseSlot(slug, id);
      slots.value = slots.value.filter((s) => s.id !== id);
    } catch (err) {
      console.error("❌ Error deleting slot:", err);
    }
  }

  function handleSlotCreated(slot: Slot) {
    slots.value.push(slot);
  }

  /**
   * Display helpers
   */
  function splitSlotByDay(slot: Slot) {
    const start = new Date(slot.start);
    const end = new Date(slot.end);

    const parts: (Slot & { day: string })[] = [];
    let dayCursor = new Date(start);
    dayCursor.setHours(0, 0, 0, 0);

    while (dayCursor < end) {
      const nextDay = new Date(dayCursor);
      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setHours(0, 0, 0, 0);

      const segStart = new Date(Math.max(start.getTime(), dayCursor.getTime()));
      const segEnd = new Date(Math.min(end.getTime(), nextDay.getTime()));

      if (segEnd > segStart) {
        parts.push({
          ...slot,
          start: toLocalIso(segStart),
          end: toLocalIso(segEnd),
          day: ymdLocal(segStart),
        });
      }

      dayCursor = nextDay;
    }

    return parts;
  }

  function daySlots(date: string) {
    const all: (Slot & { day: string })[] = [];
    for (const s of slots.value) {
      all.push(...splitSlotByDay(s));
    }
    return all.filter((p) => p.day === date);
  }

  function slotStyle(slot: Slot) {
    const start = new Date(slot.start);
    const end = new Date(slot.end);

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

    if (heightMin <= 0) {
      return { display: "none" };
    }

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

  return {
    slots,
    loading,
    fetchCurrentWeek,
    addSlot,
    editSlot,
    removeSlot,
    handleSlotCreated,
    daySlots,
    splitSlotByDay,
    slotStyle,
    formatHour,
  };
}
