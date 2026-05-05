/**
 * src/components/unavailabilities/UnavailabilitySection.tsx
 * Layer  : Frontend — composant section
 * Role   : Section de gestion des indisponibilités (owner uniquement).
 *          Liste les règles récurrentes et ponctuelles, permet la création
 *          et l'édition via UnavailabilityForm.
 * Parent : FreelancerProfilePage
 * Deps   : api.createUnavailability, api.updateUnavailability, api.deleteUnavailability
 */

import { useState, type Dispatch, type SetStateAction } from "react";
import {
  createUnavailability,
  deleteUnavailability,
  updateUnavailability,
} from "../../api";
import type { Unavailability } from "../../types";
import UnavailabilityForm from "./UnavailabilityForm";

const WEEKDAY_LABELS: Record<number, string> = {
  1: "Lundi", 2: "Mardi", 3: "Mercredi", 4: "Jeudi",
  5: "Vendredi", 6: "Samedi", 7: "Dimanche",
};

function formatDate(d: string | null): string {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function unavailLabel(u: Unavailability): string {
  if (u.recurrence_type === "weekly" && u.weekday) {
    const day = WEEKDAY_LABELS[u.weekday] ?? `Jour ${u.weekday}`;
    const end = u.recurrence_end ? ` (jusqu'au ${formatDate(u.recurrence_end)})` : "";
    return `${day}${end}`;
  }
  return formatDate(u.start_date);
}

interface Props {
  slug: string;
  token: string;
  unavailabilities: Unavailability[];
  onUnavailabilitiesChange: Dispatch<SetStateAction<Unavailability[]>>;
}

export default function UnavailabilitySection({
  slug,
  token,
  unavailabilities,
  onUnavailabilitiesChange,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Unavailability | null>(null);
  const list = unavailabilities;

  async function handleCreate(data: Partial<Omit<Unavailability, "id" | "exceptions">>) {
    const created = await createUnavailability(slug, data, token);
    onUnavailabilitiesChange((current) => [...current, created]);
  }

  async function handleEdit(data: Partial<Omit<Unavailability, "id" | "exceptions">>) {
    if (!editing) return;
    const updated = await updateUnavailability(slug, editing.id, data, token);
    onUnavailabilitiesChange((current) =>
      current.map((u) => (u.id === editing.id ? updated : u))
    );
  }

  async function handleDelete() {
    if (!editing) return;
    await deleteUnavailability(slug, editing.id, token);
    onUnavailabilitiesChange((current) => current.filter((u) => u.id !== editing.id));
  }

  // Séparer récurrentes et ponctuelles
  const weekly = list.filter((u) => u.recurrence_type === "weekly");
  const once   = list.filter((u) => u.recurrence_type === "once");

  return (
    <section className="rounded-eb-card border border-eb-layout bg-white p-4">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-eb-muted">
          Indisponibilités
        </p>
        <button
          type="button"
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="eb-btn-primary text-[12px] px-3 py-1.5"
        >
          + Ajouter
        </button>
      </div>

      {list.length === 0 ? (
        <p className="py-4 text-center text-[13px] text-eb-muted">
          Aucune indisponibilité définie.
        </p>
      ) : (
        <div className="space-y-4">
          {/* Récurrentes */}
          {weekly.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-eb-muted">
                Récurrentes
              </p>
              <div className="space-y-2">
                {weekly.map((u) => (
                  <UnavailabilityRow
                    key={u.id}
                    unavailability={u}
                    label={unavailLabel(u)}
                    onClick={() => { setEditing(u); setShowForm(true); }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Ponctuelles */}
          {once.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-eb-muted">
                Ponctuelles
              </p>
              <div className="space-y-2">
                {once.map((u) => (
                  <UnavailabilityRow
                    key={u.id}
                    unavailability={u}
                    label={unavailLabel(u)}
                    onClick={() => { setEditing(u); setShowForm(true); }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <UnavailabilityForm
          initial={editing ?? undefined}
          onSave={editing ? handleEdit : handleCreate}
          onDelete={editing ? handleDelete : undefined}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </section>
  );
}

// --- Ligne de liste ---
function UnavailabilityRow({
  unavailability: u,
  label,
  onClick,
}: {
  unavailability: Unavailability;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center justify-between rounded-eb border border-eb-layout bg-white px-4 py-2.5 text-left hover:border-[#93c5fd] transition-colors"
    >
      <div>
        <p className="text-[13px] font-medium text-eb-text">{label}</p>
        <p className="text-[12px] text-eb-muted">
          {`${u.start_time.slice(0, 5)} → ${u.end_time.slice(0, 5)}`}
        </p>
      </div>
      <span className="text-[12px] text-eb-muted group-hover:text-eb-text transition-colors">
        Modifier →
      </span>
    </button>
  );
}
