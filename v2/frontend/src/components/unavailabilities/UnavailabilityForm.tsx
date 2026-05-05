/**
 * src/components/unavailabilities/UnavailabilityForm.tsx
 * Layer  : Frontend — composant UI
 * Role   : Modal de création / édition d'une indisponibilité (ponctuelle ou récurrente).
 *          Gère la suppression d'une occurrence ou de toute la récurrence.
 * Parent : UnavailabilitySection
 * Deps   : types.Unavailability, api.createUnavailability, api.updateUnavailability,
 *          api.deleteUnavailability
 */

import { useState } from "react";
import type { Unavailability } from "../../types";

const WEEKDAY_LABELS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

interface FormState {
  recurrence_type: "once" | "weekly";
  weekday: string;       // 1–7, string pour l'input
  start_date: string;    // YYYY-MM-DD
  start_time: string;    // HH:MM
  end_time: string;
  recurrence_end: string;
}

function unavailToForm(u?: Unavailability): FormState {
  return {
    recurrence_type: u?.recurrence_type ?? "weekly",
    weekday:         u?.weekday != null ? String(u.weekday) : "1",
    start_date:      u?.start_date ?? "",
    start_time:      u?.start_time?.slice(0, 5) ?? "09:00",
    end_time:        u?.end_time?.slice(0, 5)   ?? "18:00",
    recurrence_end:  u?.recurrence_end          ?? "",
  };
}

interface Props {
  initial?: Unavailability;
  onSave:   (data: Partial<Omit<Unavailability, "id" | "exceptions">>) => Promise<void>;
  onDelete?:            () => Promise<void>;
  onClose:              () => void;
}

export default function UnavailabilityForm({ initial, onSave, onDelete, onClose }: Props) {
  const [form, setForm] = useState<FormState>(unavailToForm(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload: Partial<Omit<Unavailability, "id" | "exceptions">> = {
        recurrence_type: form.recurrence_type,
        start_time:      form.start_time,
        end_time:        form.end_time,
        recurrence_end:  form.recurrence_end || null,
      };
      if (form.recurrence_type === "weekly") {
        payload.weekday = parseInt(form.weekday, 10);
      } else {
        payload.start_date = form.start_date || null;
      }
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!onDelete || !window.confirm("Supprimer cette indisponibilité ?")) return;
    setSaving(true);
    try {
      await onDelete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression.");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md rounded-eb-card border border-eb-layout bg-white p-6 shadow-lg"
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[17px] font-semibold text-eb-text">
            {initial ? "Modifier l'indisponibilité" : "Nouvelle indisponibilité"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[20px] leading-none text-eb-muted hover:text-eb-text"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">

          {/* Type de récurrence */}
          <div className="flex gap-2">
            {(["weekly", "once"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set("recurrence_type", t)}
                className={`eb-chip cursor-pointer transition-all ${
                  form.recurrence_type === t ? "bg-eb-primary text-white" : ""
                }`}
              >
                {t === "weekly" ? "Récurrente (hebdo)" : "Ponctuelle"}
              </button>
            ))}
          </div>

          {/* Jour : weekday (récurrent) ou date (ponctuel) */}
          {form.recurrence_type === "weekly" ? (
            <div>
              <label className="mb-1 block text-[12px] font-medium text-eb-secondary">Jour de la semaine</label>
              <select
                className="eb-input"
                value={form.weekday}
                onChange={(e) => set("weekday", e.target.value)}
              >
                {WEEKDAY_LABELS.map((label, i) => (
                  <option key={i + 1} value={String(i + 1)}>{label}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-[12px] font-medium text-eb-secondary">Date</label>
              <input
                type="date"
                className="eb-input"
                value={form.start_date}
                onChange={(e) => set("start_date", e.target.value)}
              />
            </div>
          )}

          {/* Horaires */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[12px] font-medium text-eb-secondary">Début</label>
              <input
                type="time"
                step={900}
                className="eb-input"
                value={form.start_time}
                onChange={(e) => set("start_time", e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-eb-secondary">Fin</label>
              <input
                type="time"
                step={900}
                className="eb-input"
                value={form.end_time}
                onChange={(e) => set("end_time", e.target.value)}
              />
            </div>
          </div>

          {/* Fin de récurrence (uniquement pour weekly) */}
          {form.recurrence_type === "weekly" && (
            <div>
              <label className="mb-1 block text-[12px] font-medium text-eb-secondary">
                Fin de récurrence{" "}
                <span className="text-eb-muted font-normal">(vide = sans fin)</span>
              </label>
              <input
                type="date"
                className="eb-input"
                value={form.recurrence_end}
                onChange={(e) => set("recurrence_end", e.target.value)}
              />
            </div>
          )}

          {error && <p className="text-[13px] text-eb-google">{error}</p>}
        </div>

        {/* Actions */}
        <div className="mt-5 flex items-center justify-between gap-2">
          <div>
            {initial && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="text-[13px] text-eb-google hover:underline disabled:opacity-50"
              >
                Supprimer
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="eb-btn-ghost">
              Annuler
            </button>
            <button type="submit" disabled={saving} className="eb-btn-primary">
              {saving ? "Enregistrement…" : initial ? "Enregistrer" : "Ajouter"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
