// src/composables/agenda/useAgendaNavigation.ts
import { ref, computed } from "vue";

export function useAgendaNavigation() {
  /**
   * Utils
   */
  function getMonday(date = new Date()): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - (day === 0 ? 6 : day - 1); // monday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function clone(d: Date) {
    return new Date(d.getTime());
  }

  function formatDayMonth(d: Date) {
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
  }

  /**
   * State
   */
  const currentWeekMonday = getMonday();
  const activeWeek = ref<Date>(new Date(currentWeekMonday));

  /**
   * Getters
   */
  const days = computed(() => {
    const monday = new Date(activeWeek.value);
    const names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday.getTime());
      d.setDate(d.getDate() + i);
      return {
        name: names[i],
        date: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
        fullDate: d.toLocaleDateString("fr-CA"), // YYYY-MM-DD
      };
    });
  });

  const weekLabel = computed(() => {
    const start = clone(activeWeek.value);
    const end = clone(activeWeek.value);
    end.setDate(end.getDate() + 6);
    return `${formatDayMonth(start)} - ${formatDayMonth(end)}`;
  });

  const isCurrentWeek = computed(() => {
    return activeWeek.value.getTime() === currentWeekMonday.getTime();
  });

  /**
   * Actions
   */
  function nextWeek() {
    activeWeek.value.setDate(activeWeek.value.getDate() + 7);
    activeWeek.value = new Date(activeWeek.value);
  }

  function previousWeek() {
    const newDate = new Date(activeWeek.value);
    newDate.setDate(newDate.getDate() - 7);

    if (newDate < currentWeekMonday) return; // block before current week
    activeWeek.value = newDate;
  }

  function onDatePicked(date: Date) {
    const monday = getMonday(date);
    activeWeek.value = monday;
  }

  /**
   * Expose API
   */
  return {
    activeWeek,
    currentWeekMonday,
    weekLabel,
    isCurrentWeek,
    days,
    nextWeek,
    previousWeek,
    onDatePicked,
  };
}
