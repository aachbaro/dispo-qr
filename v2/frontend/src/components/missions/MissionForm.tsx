/**
 * src/components/missions/MissionForm.tsx
 * Layer  : Frontend — composant UI
 * Role   : Formulaire de création / édition d'une mission (modal overlay).
 *          Gère les infos client, statut, tarif, dates.
 * Parent : MissionsSection
 * Deps   : types.Mission, api.createMission, api.updateMission
 */

import { useState } from "react";
import type { Mission, MissionStatus } from "../../types";

const STATUS_LABELS: Record<MissionStatus, string> = {
  proposée:  "Proposée",
  en_cours:  "En cours",
  terminée:  "Terminée",
  refusée:   "Refusée",
};

const STATUS_LIST: MissionStatus[] = ["proposée", "en_cours", "terminée", "refusée"];

interface FormState {
  title: string;
  description: string;
  status: MissionStatus;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_company: string;
  daily_rate: string;
  total_amount: string;
  start_date: string;
  end_date: string;
  notes: string;
}

function missionToForm(m?: Mission): FormState {
  return {
    title:          m?.title         ?? "",
    description:    m?.description   ?? "",
    status:         m?.status        ?? "proposée",
    client_name:    m?.client_name   ?? "",
    client_email:   m?.client_email  ?? "",
    client_phone:   m?.client_phone  ?? "",
    client_company: m?.client_company ?? "",
    daily_rate:     m?.daily_rate    ?? "",
    total_amount:   m?.total_amount  ?? "",
    start_date:     m?.start_date    ?? "",
    end_date:       m?.end_date      ?? "",
    notes:          m?.notes         ?? "",
  };
}

interface Props {
  initial?: Mission;
  onSave: (data: Partial<Omit<Mission, "id" | "created_at" | "updated_at">>) => Promise<void>;
  onClose: () => void;
}

export default function MissionForm({ initial, onSave, onClose }: Props) {
  const [form, setForm] = useState<FormState>(missionToForm(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError("Le titre est requis."); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        title:          form.title.trim(),
        description:    form.description.trim(),
        status:         form.status,
        client_name:    form.client_name.trim(),
        client_email:   form.client_email.trim(),
        client_phone:   form.client_phone.trim(),
        client_company: form.client_company.trim(),
        daily_rate:     form.daily_rate   || null,
        total_amount:   form.total_amount || null,
        start_date:     form.start_date   || null,
        end_date:       form.end_date     || null,
        notes:          form.notes.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-lg rounded-eb-card border border-eb-layout bg-white p-6 shadow-lg"
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[17px] font-semibold text-eb-text">
            {initial ? "Modifier la mission" : "Nouvelle mission"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[20px] leading-none text-eb-muted hover:text-eb-text"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        {/* Contenu scrollable */}
        <div className="max-h-[70vh] overflow-y-auto space-y-4 pr-1">

          {/* Titre + Statut */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-[12px] font-medium text-eb-secondary">
                Titre *
              </label>
              <input
                className="eb-input"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Développement site web…"
                autoFocus
              />
            </div>
            <div className="w-36">
              <label className="mb-1 block text-[12px] font-medium text-eb-secondary">
                Statut
              </label>
              <select
                className="eb-input"
                value={form.status}
                onChange={(e) => set("status", e.target.value as MissionStatus)}
              >
                {STATUS_LIST.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-[12px] font-medium text-eb-secondary">
              Description
            </label>
            <textarea
              className="eb-input resize-none"
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Contexte, périmètre de la mission…"
            />
          </div>

          {/* Client */}
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-eb-muted pt-1">
            Client
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[12px] font-medium text-eb-secondary">Nom</label>
              <input
                className="eb-input"
                value={form.client_name}
                onChange={(e) => set("client_name", e.target.value)}
                placeholder="Jean Dupont"
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-eb-secondary">Entreprise</label>
              <input
                className="eb-input"
                value={form.client_company}
                onChange={(e) => set("client_company", e.target.value)}
                placeholder="Acme Corp"
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-eb-secondary">Email</label>
              <input
                type="email"
                className="eb-input"
                value={form.client_email}
                onChange={(e) => set("client_email", e.target.value)}
                placeholder="contact@acme.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-eb-secondary">Téléphone</label>
              <input
                type="tel"
                className="eb-input"
                value={form.client_phone}
                onChange={(e) => set("client_phone", e.target.value)}
                placeholder="+33 6 00 00 00 00"
              />
            </div>
          </div>

          {/* Tarif + Dates */}
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-eb-muted pt-1">
            Tarif & Dates
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[12px] font-medium text-eb-secondary">TJM (€)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="eb-input"
                value={form.daily_rate}
                onChange={(e) => set("daily_rate", e.target.value)}
                placeholder="600"
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-eb-secondary">Montant total (€)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="eb-input"
                value={form.total_amount}
                onChange={(e) => set("total_amount", e.target.value)}
                placeholder="12 000"
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-eb-secondary">Début</label>
              <input
                type="date"
                className="eb-input"
                value={form.start_date}
                onChange={(e) => set("start_date", e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-eb-secondary">Fin</label>
              <input
                type="date"
                className="eb-input"
                value={form.end_date}
                onChange={(e) => set("end_date", e.target.value)}
              />
            </div>
          </div>

          {/* Notes internes */}
          <div>
            <label className="mb-1 block text-[12px] font-medium text-eb-secondary">
              Notes internes
            </label>
            <textarea
              className="eb-input resize-none"
              rows={2}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Remarques, contacts supplémentaires…"
            />
          </div>

          {error && (
            <p className="text-[13px] text-eb-google">{error}</p>
          )}
        </div>

        {/* Actions */}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="eb-btn-ghost">
            Annuler
          </button>
          <button type="submit" disabled={saving} className="eb-btn-primary">
            {saving ? "Enregistrement…" : initial ? "Enregistrer" : "Créer la mission"}
          </button>
        </div>
      </form>
    </div>
  );
}
