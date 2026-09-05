import { useState } from "react";
import {
  type PageProps,
  type Board,
  type Shift,
  type Availability,
  type Action,
  addDays,
  dateLabel,
  days,
  hours,
  minutes,
  qualified,
  shiftKey,
  skillNames,
  states,
} from "../types";
import { NavLink } from "react-router-dom";
import { Stat, Empty } from "../ui";

type AddCtx = { date: string; service: string; role: string };
type AssignCtx = { shift: Shift; posIdx: number };

const ROLES = [
  { key: "salle", label: "Salle" },
  { key: "plonge", label: "Plonge" },
  { key: "cuisine", label: "Cuisine" },
] as const;

export default function PlanningPage({ board, week, act }: PageProps) {
  const [personal, setPersonal] = useState(false);
  const [genCount, setGenCount] = useState(4);
  const [addCtx, setAddCtx] = useState<AddCtx | null>(null);
  const [assignCtx, setAssignCtx] = useState<AssignCtx | null>(null);
  const manager = board.me.manager;
  const shifts = manager ? week.shifts : week.published?.shifts || [];
  const displayed = personal
    ? shifts.filter((s) =>
        s.assignments.some((a) => a.employeeId === board.me.id),
      )
    : shifts;
  const slots = shifts.reduce((n, s) => n + s.count, 0);
  const assigned = shifts.reduce((n, s) => n + s.assignments.length, 0);
  const myMinutes = shifts.reduce(
    (n, s) =>
      n +
      (s.assignments.some((a) => a.employeeId === board.me.id)
        ? minutes(s)
        : 0),
    0,
  );
  const active = board.employees.filter(
    (e) =>
      e.active && (e.skills.includes("salle") || e.skills.includes("plonge")),
  );
  const confirmed = active.filter((e) => week.confirmation?.[e.id]).length;
  const issues = [
    ...board.issues.filter((i) => i.week === week.start),
    ...(week.generationWarnings || []),
  ];

  return (
    <>
      <div className="lulu-stats">
        <Stat
          label="LE PLANNING"
          value={
            manager
              ? week.status === "published"
                ? "Publié"
                : "Brouillon"
              : week.published
                ? "Publié"
                : "À venir"
          }
          detail={
            week.published
              ? `Dernière publication : ${new Date(week.published.at).toLocaleDateString("fr-FR")}`
              : "En préparation chez Jean-Sébastien"
          }
        />
        <Stat
          label={manager ? "POSTES COUVERTS" : "MES HEURES"}
          value={manager ? `${assigned} / ${slots}` : hours(myMinutes)}
          detail={
            manager
              ? `${Math.max(0, slots - assigned)} poste(s) à compléter`
              : "Pauses repas déjà déduites"
          }
        />
        <Stat
          label={manager ? "DISPONIBILITÉS CONFIRMÉES" : "MA SEMAINE"}
          value={
            manager
              ? `${confirmed} / ${active.length}`
              : week.mine.confirmed
                ? "Confirmée"
                : "À confirmer"
          }
          detail={manager ? "Salle et plonge" : "Dans Mes disponibilités"}
        />
      </div>

      <div className="lulu-panel">
        {manager && (
          <details className="lulu-confirmations">
            <summary>Qui a confirmé sa semaine ?</summary>
            <div>
              {active.map((e) => (
                <span
                  className={`lulu-status ${week.confirmation?.[e.id] ? "good" : ""}`}
                  key={e.id}
                >
                  {e.name} ·{" "}
                  {week.confirmation?.[e.id] ? "Confirmée" : "À confirmer"}
                </span>
              ))}
            </div>
          </details>
        )}

        <div className="lulu-panel-head">
          <div>
            <h2>
              Au fil des services{" "}
              {week.label && (
                <span className="lulu-tag">Semaine {week.label}</span>
              )}
            </h2>
            <p>
              {manager
                ? "Cliquez sur un poste pour l'affecter ou le supprimer."
                : "La version publiée par Jean-Sébastien."}
            </p>
          </div>
          <div className="lulu-toggle">
            <button
              className={!personal ? "selected" : ""}
              onClick={() => setPersonal(false)}
            >
              Toute l'équipe
            </button>
            <button
              className={personal ? "selected" : ""}
              onClick={() => setPersonal(true)}
            >
              Mon planning
            </button>
          </div>
        </div>

        {manager && (
          <div className="lulu-toolbar">
            <label>
              Proposer sur{" "}
              <select
                aria-label="Nombre de semaines à générer"
                value={genCount}
                onChange={(e) => setGenCount(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n} semaine{n > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="primary"
              onClick={() =>
                act(
                  "generate",
                  { count: genCount },
                  "Proposition générée. Vérifiez les alertes avant publication.",
                )
              }
            >
              ✳ Générer une proposition
            </button>
            <button
              onClick={() =>
                act(
                  "remind",
                  {},
                  "Rappels envoyés aux employés concernés.",
                )
              }
            >
              Rappeler les disponibilités
            </button>
            <button
              onClick={() => {
                if (
                  window.confirm(
                    "Vider toutes les affectations non verrouillées de cette semaine ?",
                  )
                )
                  act("clear", {}, "Planning vidé.");
              }}
            >
              Vider le brouillon
            </button>
            <button
              className="lulu-outline"
              onClick={() =>
                act("publish", {}, "Planning publié. L'équipe a été notifiée.")
              }
            >
              Publier cette semaine
            </button>
          </div>
        )}
        {manager && (
          <p className="lulu-helper padded">
            La génération remplace les affectations non verrouillées sur{" "}
            {genCount} semaine(s) à partir du {dateLabel(week.start)}.
          </p>
        )}

        {!manager && !week.published ? (
          <Empty
            title="Le planning se prépare."
            text="Vous recevrez une notification dès sa publication."
          />
        ) : (
          <div className="lulu-planning-scroll">
            <div className="lulu-planning-grid">
              {days.map((day, index) => {
                const date = addDays(week.start, index);
                return (
                  <div className="lulu-day" key={day}>
                    <div
                      className={`lulu-day-heading ${index > 4 ? "weekend" : ""}`}
                    >
                      <span>{day}</span>
                      <strong>{dateLabel(date, { day: "2-digit" })}</strong>
                    </div>
                    {(["midi", "soir"] as const).map((service) => (
                      <section className="lulu-service" key={service}>
                        <h3>{service === "midi" ? "☀ MIDI" : "☾ SOIR"}</h3>
                        {ROLES.map(({ key: role, label }) => {
                          const rShifts = displayed.filter(
                            (s) =>
                              s.date === date &&
                              s.service === service &&
                              s.role === role,
                          );
                          const isCuisine = role === "cuisine";
                          const hasPositions = rShifts.some((s) => s.count > 0);
                          return (
                            <div key={role} className="lulu-role-section">
                              <span className="lulu-role-label">{label}</span>
                              {rShifts.map((s) =>
                                Array.from(
                                  { length: s.count },
                                  (_, posIdx) => (
                                    <PositionCard
                                      key={`${s.id}-${posIdx}`}
                                      shift={s}
                                      posIdx={posIdx}
                                      board={board}
                                      editable={!!manager && !isCuisine}
                                      onOpen={() =>
                                        setAssignCtx({ shift: s, posIdx })
                                      }
                                    />
                                  ),
                                ),
                              )}
                              {!hasPositions && (
                                <span className="lulu-no-service">—</span>
                              )}
                              {manager && !isCuisine && (
                                <button
                                  className="lulu-add-slot-btn"
                                  onClick={() =>
                                    setAddCtx({ date, service, role })
                                  }
                                >
                                  + Ajouter un poste
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </section>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {manager && (
        <div className="lulu-bottom-grid">
          <div className="lulu-panel">
            <div className="lulu-panel-head">
              <h2>À regarder ensemble</h2>
              <span className="lulu-tag">{issues.length} signalement(s)</span>
            </div>
            {issues.length ? (
              <div className="lulu-issues">
                {issues.map((issue, index) => (
                  <div key={index} className={`lulu-issue ${issue.severity}`}>
                    <span>{issue.severity === "error" ? "!" : "·"}</span>
                    <p>
                      <strong>
                        {dateLabel(issue.date, {
                          weekday: "short",
                          day: "numeric",
                        })}{" "}
                        · {issue.service}
                      </strong>
                      {issue.message}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="padded">Aucun conflit détecté sur cette semaine.</p>
            )}
          </div>
          <div className="lulu-panel">
            <div className="lulu-panel-head">
              <h2>Les nouvelles de l'équipe</h2>
            </div>
            <div className="padded">
              {board.notifications
                .slice(-3)
                .reverse()
                .map((n) => (
                  <p className="lulu-mini-news" key={n.id}>
                    {n.message}
                  </p>
                ))}
              {!board.notifications.length && (
                <p className="lulu-helper">
                  Les confirmations apparaîtront ici.
                </p>
              )}
              <NavLink className="lulu-text-link" to="/lulu/notifications">
                Ouvrir le fil →
              </NavLink>
            </div>
          </div>
        </div>
      )}

      {addCtx && (
        <SlotAddDialog
          ctx={addCtx}
          weekShifts={week.shifts}
          act={act}
          onClose={() => setAddCtx(null)}
        />
      )}
      {assignCtx && (
        <PositionDialog
          ctx={assignCtx}
          board={board}
          weekShifts={week.shifts}
          weekAvailability={week.availability || {}}
          act={act}
          onClose={() => setAssignCtx(null)}
        />
      )}
    </>
  );
}

// One card per position (one person per card)
function PositionCard({
  shift: s,
  posIdx,
  board,
  editable,
  onOpen,
}: {
  shift: Shift;
  posIdx: number;
  board: Board;
  editable: boolean;
  onOpen: () => void;
}) {
  const a = s.assignments[posIdx];
  const emp = a
    ? board.employees.find((e) => e.id === a.employeeId)
    : undefined;
  const filled = !!a;

  return (
    <div
      className={`lulu-shift ${s.role} ${!filled ? "unfilled" : ""} ${editable ? "clickable" : ""}`}
      onClick={editable ? onOpen : undefined}
      onKeyDown={editable ? (e) => e.key === "Enter" && onOpen() : undefined}
      role={editable ? "button" : undefined}
      tabIndex={editable ? 0 : undefined}
    >
      <div className="lulu-shift-time">
        {s.start.replace(":", "h")} – {s.end.replace(":", "h")}
        {s.fixed && <span className="lulu-shift-fixed-tag"> · Fixe</span>}
      </div>
      {s.required.length > 0 && (
        <div className="lulu-requirements">
          {s.required.map((r) => skillNames[r]).join(" · ")}
        </div>
      )}
      {filled ? (
        <div className="lulu-assignee">
          <span>{emp?.name ?? "Ancien membre"}</span>
          {a.locked && <span title="Verrouillé">🔒</span>}
        </div>
      ) : (
        <div className="lulu-missing">Poste libre</div>
      )}
    </div>
  );
}

function SlotAddDialog({
  ctx,
  weekShifts,
  act,
  onClose,
}: {
  ctx: AddCtx;
  weekShifts: Shift[];
  act: Action;
  onClose: () => void;
}) {
  const isWeekend = [0, 6].includes(new Date(`${ctx.date}T12:00`).getDay());
  const [start, setStart] = useState(
    ctx.service === "midi" ? "11:00" : "18:30",
  );
  const [end, setEnd] = useState(
    ctx.service === "midi"
      ? isWeekend
        ? "17:00"
        : "15:30"
      : isWeekend
        ? "00:00"
        : "23:00",
  );
  const [withKeys, setWithKeys] = useState(false);
  const [saving, setSaving] = useState(false);

  async function confirm() {
    setSaving(true);
    const newShift: Shift = {
      id: crypto.randomUUID(),
      date: ctx.date,
      service: ctx.service,
      role: ctx.role,
      start,
      end,
      count: 1,
      required: withKeys ? ["cles"] : [],
      assignments: [],
      fixed: false,
    };
    const existing = weekShifts.filter((s) => !s.fixed);
    const ok = await act(
      "shifts",
      { shifts: [...existing, newShift] },
      "Poste ajouté.",
    );
    setSaving(false);
    if (ok) onClose();
  }

  const dayLabel = dateLabel(ctx.date, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="lulu-modal-backdrop" onClick={onClose}>
      <section
        className="lulu-modal lulu-assign-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="slot-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lulu-panel-head">
          <div>
            <p className="lulu-eyebrow">
              NOUVEAU POSTE · {skillNames[ctx.role].toUpperCase()} ·{" "}
              {ctx.service === "midi" ? "MIDI" : "SOIR"}
            </p>
            <h2 id="slot-title">{dayLabel}</h2>
          </div>
          <button
            type="button"
            aria-label="Fermer"
            onClick={onClose}
            style={{ padding: "8px 12px", fontSize: 18, background: "none", border: 0 }}
          >
            ×
          </button>
        </div>
        <div className="padded">
          <div className="lulu-form-grid">
            <label>
              Début
              <input
                autoFocus
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </label>
            <label>
              Fin estimée
              <input
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </label>
          </div>
          {ctx.role === "salle" && (
            <label className="lulu-check" style={{ marginTop: 4 }}>
              <input
                type="checkbox"
                checked={withKeys}
                onChange={(e) => setWithKeys(e.target.checked)}
              />
              Nécessite les clés (ouverture / fermeture)
            </label>
          )}
        </div>
        <div className="lulu-save-bar">
          <button type="button" onClick={onClose}>
            Annuler
          </button>
          <button className="primary" disabled={saving} onClick={confirm}>
            {saving ? "Ajout…" : "Ajouter"}
          </button>
        </div>
      </section>
    </div>
  );
}

function PositionDialog({
  ctx: { shift: s, posIdx },
  board,
  weekShifts,
  weekAvailability,
  act,
  onClose,
}: {
  ctx: AssignCtx;
  board: Board;
  weekShifts: Shift[];
  weekAvailability: Record<string, Availability>;
  act: Action;
  onClose: () => void;
}) {
  const currentA = s.assignments[posIdx];
  const [start, setStart] = useState(s.start);
  const [end, setEnd] = useState(s.end);
  const [withKeys, setWithKeys] = useState(
    s.required.some((r) => ["cles", "ouverture", "fermeture"].includes(r)),
  );
  const [empId, setEmpId] = useState<number | null>(
    currentA?.employeeId ?? null,
  );
  const [locked, setLocked] = useState(currentA?.locked ?? false);
  const [saving, setSaving] = useState(false);

  const origWithKeys = s.required.some((r) =>
    ["cles", "ouverture", "fermeture"].includes(r),
  );

  function getState(id: number): keyof typeof states {
    // Use a temporary shift with potentially updated times for dispo lookup
    const tmpShift = { ...s, start, end, required };
    const av = weekAvailability[String(id)];
    if (!av?.confirmed) return "unknown";
    return (
      (av.values?.[shiftKey(tmpShift)] as keyof typeof states) ||
      (av.values?.[shiftKey(s)] as keyof typeof states) ||
      (av.allAvailable ? "available" : "unknown")
    );
  }

  const required = s.role === "salle" && withKeys ? ["cles"] : [];

  const candidates = board.employees.filter(
    (e) =>
      e.active &&
      qualified({ ...e }, { ...s, start, end, required }) &&
      (e.id === empId ||
        !s.assignments.some((a, i) => i !== posIdx && a.employeeId === e.id)),
  );

  async function save() {
    setSaving(true);

    const newAssignments = [...s.assignments];
    if (empId === null) {
      if (posIdx < newAssignments.length) newAssignments.splice(posIdx, 1);
    } else if (posIdx < newAssignments.length) {
      newAssignments[posIdx] = { employeeId: empId, locked };
    } else {
      newAssignments.push({ employeeId: empId, locked });
    }

    const payload: Record<string, unknown> = {
      shiftId: s.id,
      assignments: newAssignments,
    };
    if (start !== s.start) payload.start = start;
    if (end !== s.end) payload.end = end;
    if (s.role === "salle" && withKeys !== origWithKeys) {
      payload.required = withKeys ? ["cles"] : [];
    }

    const ok = await act("assign", payload, "Enregistré.");
    setSaving(false);
    if (ok) onClose();
  }

  async function deletePosition() {
    if (!window.confirm("Supprimer ce poste ?")) return;
    setSaving(true);
    let ok: boolean;
    if (s.count === 1) {
      const updated = weekShifts.filter((sh) => !sh.fixed && sh.id !== s.id);
      ok = await act("shifts", { shifts: updated }, "Poste supprimé.");
    } else {
      const updated = weekShifts.filter((sh) => !sh.fixed).map((sh) => {
        if (sh.id !== s.id) return sh;
        const newA = sh.assignments.filter((_, i) => i !== posIdx);
        return { ...sh, count: sh.count - 1, assignments: newA };
      });
      ok = await act("shifts", { shifts: updated }, "Poste supprimé.");
    }
    setSaving(false);
    if (ok) onClose();
  }

  const dayLabel = dateLabel(s.date, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const state = empId !== null ? getState(empId) : null;

  return (
    <div className="lulu-modal-backdrop" onClick={onClose}>
      <section
        className="lulu-modal lulu-assign-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pos-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lulu-panel-head">
          <div>
            <p className="lulu-eyebrow">
              {skillNames[s.role].toUpperCase()} ·{" "}
              {s.service === "midi" ? "MIDI" : "SOIR"}
            </p>
            <h2 id="pos-title">{dayLabel}</h2>
          </div>
          <button
            type="button"
            aria-label="Fermer"
            onClick={onClose}
            style={{ padding: "8px 12px", fontSize: 18, background: "none", border: 0 }}
          >
            ×
          </button>
        </div>

        <div className="padded">
          <div className="lulu-form-grid" style={{ marginBottom: 20 }}>
            <label>
              Début
              <input
                autoFocus
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </label>
            <label>
              Fin estimée
              <input
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </label>
          </div>

          {s.role === "salle" && (
            <label className="lulu-check" style={{ marginBottom: 20 }}>
              <input
                type="checkbox"
                checked={withKeys}
                onChange={(e) => setWithKeys(e.target.checked)}
              />
              Nécessite les clés (ouverture / fermeture)
            </label>
          )}

          <label style={{ display: "block", marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 500, display: "block", marginBottom: 7 }}>
              Employé affecté
            </span>
            <select
              value={empId ?? ""}
              onChange={(e) =>
                setEmpId(e.target.value === "" ? null : Number(e.target.value))
              }
              style={{ width: "100%" }}
            >
              <option value="">— Poste libre —</option>
              {candidates.map((e) => {
                const st = getState(e.id);
                return (
                  <option key={e.id} value={e.id} disabled={st === "unavailable"}>
                    {e.name} · {states[st]}
                  </option>
                );
              })}
            </select>
          </label>

          {empId !== null && state !== null && (
            <p className="lulu-helper" style={{ marginBottom: 12 }}>
              Disponibilité :{" "}
              <span className={`lulu-dispos-state ${state}`}>{states[state]}</span>
            </p>
          )}

          {empId !== null && (
            <label className="lulu-check">
              <input
                type="checkbox"
                checked={locked}
                onChange={(e) => setLocked(e.target.checked)}
              />
              Verrouiller (ne sera pas remplacé lors d'une génération)
            </label>
          )}
        </div>

        <div className="lulu-save-bar">
          <button
            type="button"
            style={{ border: "1px solid #edcfbf", fontSize: 12, padding: "8px 14px", color: "#b96046", background: "none", borderRadius: 8 }}
            onClick={deletePosition}
            disabled={saving}
          >
            Supprimer ce poste
          </button>
          <div style={{ display: "flex", gap: 9 }}>
            <button type="button" onClick={onClose}>
              Annuler
            </button>
            <button className="primary" disabled={saving} onClick={save}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
