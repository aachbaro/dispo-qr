export type AvailabilityState =
  "available" | "prefer_not" | "unavailable" | "unknown";
export type Preferences = Record<string, number>;
export type Availability = {
  importNote?: string;
  values: Record<string, AvailabilityState>;
  preferences: Preferences;
  confirmed: boolean;
  allAvailable: boolean;
};
export type FixedShift = {
  day: number;
  service: string;
  start: string;
  end: string;
};
export type Employee = {
  id: number;
  name: string;
  manager?: boolean;
  active: boolean;
  weeklyHours?: number;
  skills: string[];
  defaults?: Partial<Availability>;
  fixedShifts?: FixedShift[];
};
export type Assignment = { employeeId: number; locked: boolean };
export type Shift = {
  id: string;
  date: string;
  service: string;
  role: string;
  start: string;
  end: string;
  count: number;
  required: string[];
  assignments: Assignment[];
  fixed: boolean;
};
export type Issue = {
  week: string;
  date: string;
  shiftId: string;
  service: string;
  severity: string;
  message: string;
};
export type Week = {
  start: string;
  prepared: boolean;
  label: string;
  status: string;
  shifts: Shift[];
  mine: Availability;
  availability?: Record<string, Availability>;
  confirmation?: Record<string, boolean>;
  published: { shifts: Shift[]; at: string } | null;
  generationWarnings?: Issue[];
};
export type Board = {
  revision: number;
  me: Employee;
  employees: Employee[];
  weeks: Record<string, Week>;
  templates: Record<string, Shift[]>;
  rules: Record<string, number>;
  notifications: {
    id: string;
    message: string;
    createdAt: string;
    read: boolean;
  }[];
  issues: Issue[];
};

export const days = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];
export const skillNames: Record<string, string> = {
  salle: "Salle",
  plonge: "Plonge",
  cuisine: "Cuisine",
  cles: "Clés",
  ouverture: "Clés",
  fermeture: "Clés",
};
export const states: Record<AvailabilityState, string> = {
  unknown: "À confirmer",
  available: "Disponible",
  prefer_not: "De préférence non",
  unavailable: "Indisponible",
};
export const preferences: Record<string, string> = {
  weekends: "Éviter les week-ends",
  split: "Éviter les coupures",
  compact: "Regrouper sur moins de jours",
  evenings: "Éviter les soirs",
  lunches: "Éviter les midis",
  stable: "Garder des horaires stables",
  variety: "Varier mes collègues",
};
export function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function addDays(value: string, n: number) {
  const d = new Date(`${value}T12:00:00`);
  d.setDate(d.getDate() + n);
  return iso(d);
}
export function monday(value = iso(new Date())) {
  const d = new Date(`${value}T12:00:00`);
  return addDays(value, -((d.getDay() + 6) % 7));
}
export function dateLabel(
  value: string,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" },
) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("fr-FR", options);
}
export function clock(value: string) {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}
export function minutes(shift: Shift) {
  return Math.max(
    0,
    ((clock(shift.end) - clock(shift.start) + 1440) % 1440) - 30,
  );
}
export function hours(value: number) {
  const total = Math.round(value);
  const sign = total < 0 ? "−" : "";
  return `${sign}${Math.floor(Math.abs(total) / 60)} h${Math.abs(total) % 60 ? ` ${String(Math.abs(total) % 60).padStart(2, "0")}` : ""}`;
}
export function shiftKey(s: Shift) {
  return `${(new Date(`${s.date}T12:00:00`).getDay() + 6) % 7}|${s.service}|${s.role}|${s.start}|${s.end}|${[...s.required].sort().join(",")}`;
}
export function qualified(e: Employee, s: Shift) {
  return (
    e.active &&
    [s.role, ...s.required].every((skill) => e.skills.includes(skill))
  );
}
export const API = `${(import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8002/api").replace(/\/$/, "")}/lulu`;
export async function request<T>(
  path: string,
  token: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(`${API}/${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Lulu ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      typeof data.detail === "string"
        ? data.detail
        : Array.isArray(data)
          ? data.join(" ")
          : "Impossible d’enregistrer. Vérifiez les champs et réessayez.",
    );
    Object.assign(error, { status: response.status });
    throw error;
  }
  return data;
}

export type Action = (
  action: string,
  payload?: Record<string, unknown>,
  message?: string,
) => Promise<boolean>;
export type PageProps = {
  board: Board;
  week: Week;
  act: Action;
  busy: boolean;
};
