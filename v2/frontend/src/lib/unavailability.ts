import type { Unavailability } from "../types";

const DAY_MS = 24 * 60 * 60 * 1000;

const WEEKDAY_LABELS: Record<number, string> = {
  1: "Lundi",
  2: "Mardi",
  3: "Mercredi",
  4: "Jeudi",
  5: "Vendredi",
  6: "Samedi",
  7: "Dimanche",
};

export interface UnavailabilityOccurrence {
  sourceId: number;
  date: string;
  start: string;
  end: string;
  source: Unavailability;
}

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function addDays(date: Date, amount: number): Date {
  return new Date(date.getTime() + amount * DAY_MS);
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function compareDateKeys(left: string, right: string): number {
  return left.localeCompare(right);
}

function getOnceRangeEnd(item: Unavailability): string | null {
  return item.recurrence_end || item.start_date;
}

export function formatUnavailabilityDate(value: string | null): string {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

export function formatUnavailabilityDateWithWeekday(value: string): string {
  const date = parseDateOnly(value);
  return date.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

export function formatUnavailabilityTimeRange(item: Pick<Unavailability, "start_time" | "end_time">): string {
  return `${item.start_time.slice(0, 5)} → ${item.end_time.slice(0, 5)}`;
}

export function formatUnavailabilityRuleLabel(item: Unavailability): string {
  if (item.recurrence_type === "weekly") {
    const weekday = item.weekday ? WEEKDAY_LABELS[item.weekday] ?? `Jour ${item.weekday}` : "Chaque semaine";
    return item.recurrence_end
      ? `${weekday} jusqu'au ${formatUnavailabilityDate(item.recurrence_end)}`
      : `${weekday} chaque semaine`;
  }

  const end = getOnceRangeEnd(item);
  if (item.start_date && end && end !== item.start_date) {
    return `Du ${formatUnavailabilityDate(item.start_date)} au ${formatUnavailabilityDate(end)}`;
  }
  return formatUnavailabilityDate(item.start_date);
}

export function buildOccurrenceForDate(
  item: Unavailability,
  dateKey: string
): UnavailabilityOccurrence | null {
  if (item.recurrence_type === "weekly") {
    const weekday = parseDateOnly(dateKey).getDay();
    const normalizedWeekday = weekday === 0 ? 7 : weekday;
    if (item.weekday !== normalizedWeekday) return null;
    if (item.recurrence_end && compareDateKeys(dateKey, item.recurrence_end) > 0) return null;
    if (item.exceptions.includes(dateKey)) return null;
    return {
      sourceId: item.id,
      date: dateKey,
      start: `${dateKey}T${item.start_time}`,
      end: `${dateKey}T${item.end_time}`,
      source: item,
    };
  }

  if (!item.start_date) return null;
  const end = getOnceRangeEnd(item);
  if (!end) return null;
  if (compareDateKeys(dateKey, item.start_date) < 0) return null;
  if (compareDateKeys(dateKey, end) > 0) return null;

  return {
    sourceId: item.id,
    date: dateKey,
    start: `${dateKey}T${item.start_time}`,
    end: `${dateKey}T${item.end_time}`,
    source: item,
  };
}

export function listUpcomingUnavailabilityOccurrences(
  items: Unavailability[],
  options?: { fromDate?: string; maxDays?: number; limit?: number }
): UnavailabilityOccurrence[] {
  const fromDate = options?.fromDate ?? toDateKey(new Date());
  const maxDays = options?.maxDays ?? 45;
  const limit = options?.limit ?? 10;

  const start = parseDateOnly(fromDate);
  const occurrences: UnavailabilityOccurrence[] = [];

  for (let offset = 0; offset < maxDays && occurrences.length < limit; offset += 1) {
    const dateKey = toDateKey(addDays(start, offset));
    for (const item of items) {
      const occurrence = buildOccurrenceForDate(item, dateKey);
      if (occurrence) {
        occurrences.push(occurrence);
        if (occurrences.length >= limit) break;
      }
    }
  }

  return occurrences.sort((left, right) => {
    const dateOrder = left.date.localeCompare(right.date);
    if (dateOrder !== 0) return dateOrder;
    return left.start.localeCompare(right.start);
  });
}
