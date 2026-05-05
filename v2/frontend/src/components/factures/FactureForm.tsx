/**
 * src/components/factures/FactureForm.tsx
 * Layer  : Frontend — composant UI
 * Role   : Formulaire modal de création / édition d'une facture manuelle.
 */

import { useState } from "react";

import type { FacturePayload } from "../../api";
import type { Facture, FactureStatus, Mission } from "../../types";

const STATUS_LABELS: Record<FactureStatus, string> = {
  pending_payment: "En attente",
  paid: "Payée",
  canceled: "Annulée",
};

const STATUS_LIST: FactureStatus[] = ["pending_payment", "paid", "canceled"];

interface FormState {
  mission_id: string;
  numero: string;
  date_emission: string;
  status: FactureStatus;
  client_name: string;
  client_address_ligne1: string;
  client_address_ligne2: string;
  client_code_postal: string;
  client_ville: string;
  client_pays: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  description: string;
  hours: string;
  rate: string;
  montant_ht: string;
  tva: string;
  montant_ttc: string;
  mention_tva: string;
  conditions_paiement: string;
  penalites_retard: string;
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function toFixedAmount(value: number): string {
  return value.toFixed(2);
}

function normalizeNumberInput(value: string): string {
  return value.replace(",", ".").trim();
}

function parseNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number.parseFloat(normalizeNumberInput(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function computeTtc(ht: string, tva: string): string {
  const htValue = parseNumber(ht) ?? 0;
  const tvaValue = parseNumber(tva) ?? 0;
  return toFixedAmount(htValue * (1 + (tvaValue / 100)));
}

function factureToForm(facture?: Facture): FormState {
  return {
    mission_id: facture?.mission_id ? String(facture.mission_id) : "",
    numero: facture?.numero ?? "",
    date_emission: facture?.date_emission ?? todayString(),
    status: facture?.status ?? "pending_payment",
    client_name: facture?.client_name ?? "",
    client_address_ligne1: facture?.client_address_ligne1 ?? "",
    client_address_ligne2: facture?.client_address_ligne2 ?? "",
    client_code_postal: facture?.client_code_postal ?? "",
    client_ville: facture?.client_ville ?? "",
    client_pays: facture?.client_pays ?? "",
    contact_name: facture?.contact_name ?? "",
    contact_phone: facture?.contact_phone ?? "",
    contact_email: facture?.contact_email ?? "",
    description: facture?.description ?? "",
    hours: facture?.hours ?? "",
    rate: facture?.rate ?? "",
    montant_ht: facture?.montant_ht ?? "",
    tva: facture?.tva ?? "0.00",
    montant_ttc: facture?.montant_ttc ?? "",
    mention_tva: facture?.mention_tva ?? "",
    conditions_paiement: facture?.conditions_paiement ?? "",
    penalites_retard: facture?.penalites_retard ?? "",
  };
}

function applyMissionDefaults(previous: FormState, mission: Mission | undefined): FormState {
  if (!mission) {
    return { ...previous, mission_id: "" };
  }

  const next = { ...previous, mission_id: String(mission.id) };
  next.client_name = mission.client_company || mission.client_name || next.client_name;
  next.contact_name = mission.client_name || next.contact_name;
  next.contact_email = mission.client_email || next.contact_email;
  next.contact_phone = mission.client_phone || next.contact_phone;
  next.description = next.description || mission.title;

  if (!next.rate && mission.daily_rate) {
    next.rate = mission.daily_rate;
  }
  if (!next.montant_ht && mission.total_amount) {
    next.montant_ht = mission.total_amount;
    next.montant_ttc = computeTtc(next.montant_ht, next.tva);
  } else if (next.hours && next.rate) {
    const hours = parseNumber(next.hours);
    const rate = parseNumber(next.rate);
    if (hours !== null && rate !== null) {
      next.montant_ht = toFixedAmount(hours * rate);
      next.montant_ttc = computeTtc(next.montant_ht, next.tva);
    }
  }

  return next;
}

interface Props {
  initial?: Facture;
  missions: Mission[];
  onSave: (data: FacturePayload) => Promise<void>;
  onClose: () => void;
}

export default function FactureForm({ initial, missions, onSave, onClose }: Props) {
  const [form, setForm] = useState<FormState>(() => factureToForm(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField(field: keyof FormState, value: string) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  function setHours(value: string) {
    setForm((previous) => {
      const next = { ...previous, hours: value };
      const hours = parseNumber(value);
      const rate = parseNumber(previous.rate);
      if (hours !== null && rate !== null) {
        next.montant_ht = toFixedAmount(hours * rate);
        next.montant_ttc = computeTtc(next.montant_ht, previous.tva);
      }
      return next;
    });
  }

  function setRate(value: string) {
    setForm((previous) => {
      const next = { ...previous, rate: value };
      const hours = parseNumber(previous.hours);
      const rate = parseNumber(value);
      if (hours !== null && rate !== null) {
        next.montant_ht = toFixedAmount(hours * rate);
        next.montant_ttc = computeTtc(next.montant_ht, previous.tva);
      }
      return next;
    });
  }

  function setMontantHt(value: string) {
    setForm((previous) => ({
      ...previous,
      montant_ht: value,
      montant_ttc: computeTtc(value, previous.tva),
    }));
  }

  function setTva(value: string) {
    setForm((previous) => ({
      ...previous,
      tva: value,
      montant_ttc: computeTtc(previous.montant_ht, value),
    }));
  }

  function handleMissionChange(value: string) {
    const mission = missions.find((item) => item.id === Number(value));
    setForm((previous) => applyMissionDefaults(previous, mission));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!/^\d{4}-\d{1,}$/.test(form.numero.trim())) {
      setError("Format invalide. Utiliser AAAA-NNNN (ex: 2026-0001).");
      return;
    }

    if (!form.client_name.trim()) {
      setError("Le nom du client est requis.");
      return;
    }

    const montantHt = parseNumber(form.montant_ht);
    if (montantHt === null || montantHt < 0) {
      setError("Le montant HT doit être renseigné.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSave({
        mission_id: form.mission_id ? Number(form.mission_id) : null,
        numero: form.numero.trim(),
        date_emission: form.date_emission,
        status: form.status,
        client_name: form.client_name.trim(),
        client_address_ligne1: form.client_address_ligne1.trim(),
        client_address_ligne2: form.client_address_ligne2.trim(),
        client_code_postal: form.client_code_postal.trim(),
        client_ville: form.client_ville.trim(),
        client_pays: form.client_pays.trim(),
        contact_name: form.contact_name.trim(),
        contact_phone: form.contact_phone.trim(),
        contact_email: form.contact_email.trim(),
        description: form.description.trim(),
        hours: form.hours.trim() ? toFixedAmount(parseNumber(form.hours) ?? 0) : null,
        rate: form.rate.trim() ? toFixedAmount(parseNumber(form.rate) ?? 0) : null,
        montant_ht: toFixedAmount(montantHt),
        tva: toFixedAmount(parseNumber(form.tva) ?? 0),
        montant_ttc: computeTtc(toFixedAmount(montantHt), form.tva),
        mention_tva: form.mention_tva.trim(),
        conditions_paiement: form.conditions_paiement.trim(),
        penalites_retard: form.penalites_retard.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-3xl rounded-eb-card border border-eb-layout bg-white p-6 shadow-lg"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[17px] font-semibold text-eb-text">
            {initial ? "Modifier la facture" : "Nouvelle facture manuelle"}
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

        <div className="max-h-[75vh] space-y-5 overflow-y-auto pr-1">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="mb-1 block text-[12px] font-medium text-eb-secondary">
                Facture N° *
              </label>
              <input
                className="eb-input"
                value={form.numero}
                onChange={(event) => setField("numero", event.target.value)}
                placeholder="2026-0001"
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-eb-secondary">
                Date d'émission
              </label>
              <input
                type="date"
                className="eb-input"
                value={form.date_emission}
                onChange={(event) => setField("date_emission", event.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-eb-secondary">
                Statut
              </label>
              <select
                className="eb-input"
                value={form.status}
                onChange={(event) => setField("status", event.target.value as FactureStatus)}
              >
                {STATUS_LIST.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-medium text-eb-secondary">
              Mission liée
            </label>
            <select
              className="eb-input"
              value={form.mission_id}
              onChange={(event) => handleMissionChange(event.target.value)}
            >
              <option value="">Aucune mission</option>
              {missions.map((mission) => (
                <option key={mission.id} value={mission.id}>
                  {mission.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-eb-muted">
              Client
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-[12px] font-medium text-eb-secondary">
                  Nom / entreprise *
                </label>
                <input
                  className="eb-input"
                  value={form.client_name}
                  onChange={(event) => setField("client_name", event.target.value)}
                  placeholder="Acme Corp"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-[12px] font-medium text-eb-secondary">
                  Adresse ligne 1
                </label>
                <input
                  className="eb-input"
                  value={form.client_address_ligne1}
                  onChange={(event) => setField("client_address_ligne1", event.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-[12px] font-medium text-eb-secondary">
                  Adresse ligne 2
                </label>
                <input
                  className="eb-input"
                  value={form.client_address_ligne2}
                  onChange={(event) => setField("client_address_ligne2", event.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium text-eb-secondary">
                  Code postal
                </label>
                <input
                  className="eb-input"
                  value={form.client_code_postal}
                  onChange={(event) => setField("client_code_postal", event.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium text-eb-secondary">
                  Ville
                </label>
                <input
                  className="eb-input"
                  value={form.client_ville}
                  onChange={(event) => setField("client_ville", event.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-[12px] font-medium text-eb-secondary">
                  Pays
                </label>
                <input
                  className="eb-input"
                  value={form.client_pays}
                  onChange={(event) => setField("client_pays", event.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-eb-muted">
              Contact
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-[12px] font-medium text-eb-secondary">
                  Nom
                </label>
                <input
                  className="eb-input"
                  value={form.contact_name}
                  onChange={(event) => setField("contact_name", event.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium text-eb-secondary">
                  Email
                </label>
                <input
                  type="email"
                  className="eb-input"
                  value={form.contact_email}
                  onChange={(event) => setField("contact_email", event.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium text-eb-secondary">
                  Téléphone
                </label>
                <input
                  type="tel"
                  className="eb-input"
                  value={form.contact_phone}
                  onChange={(event) => setField("contact_phone", event.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-medium text-eb-secondary">
              Description
            </label>
            <textarea
              className="eb-input resize-none"
              rows={3}
              value={form.description}
              onChange={(event) => setField("description", event.target.value)}
              placeholder="Prestation, période facturée, détails utiles..."
            />
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-eb-muted">
              Montants
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-5">
              <div>
                <label className="mb-1 block text-[12px] font-medium text-eb-secondary">
                  Heures
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.25"
                  className="eb-input"
                  value={form.hours}
                  onChange={(event) => setHours(event.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium text-eb-secondary">
                  Taux (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="eb-input"
                  value={form.rate}
                  onChange={(event) => setRate(event.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium text-eb-secondary">
                  HT (€)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="eb-input"
                  value={form.montant_ht}
                  onChange={(event) => setMontantHt(event.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium text-eb-secondary">
                  TVA (%)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="eb-input"
                  value={form.tva}
                  onChange={(event) => setTva(event.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-medium text-eb-secondary">
                  TTC (€)
                </label>
                <input
                  className="eb-input bg-eb-page"
                  value={form.montant_ttc}
                  readOnly
                />
              </div>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-eb-muted">
              Mentions
            </p>
            <div className="mt-3 space-y-3">
              <input
                className="eb-input"
                value={form.mention_tva}
                onChange={(event) => setField("mention_tva", event.target.value)}
                placeholder="TVA non applicable, art. 293 B du CGI"
              />
              <textarea
                className="eb-input resize-none"
                rows={2}
                value={form.conditions_paiement}
                onChange={(event) => setField("conditions_paiement", event.target.value)}
                placeholder="Conditions de paiement"
              />
              <textarea
                className="eb-input resize-none"
                rows={2}
                value={form.penalites_retard}
                onChange={(event) => setField("penalites_retard", event.target.value)}
                placeholder="Pénalités de retard"
              />
            </div>
          </div>

          {error ? <p className="text-[13px] text-eb-google">{error}</p> : null}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="eb-btn-ghost">
            Annuler
          </button>
          <button type="submit" disabled={saving} className="eb-btn-primary">
            {saving ? "Enregistrement..." : initial ? "Enregistrer" : "Créer la facture"}
          </button>
        </div>
      </form>
    </div>
  );
}
