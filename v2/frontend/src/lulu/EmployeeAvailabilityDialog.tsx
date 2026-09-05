import { useEffect, useRef, useState } from "react";
import {
  type Board,
  type Employee,
  type AvailabilityState,
  addDays,
  dateLabel,
  days,
  monday,
  preferences,
  qualified,
  availabilityState,
  skillNames,
  states,
} from "./types";

/** Read-only manager view. Its week picker never changes the main planning week. */
export default function EmployeeAvailabilityDialog({
  employee,
  initialWeek,
  loadWeek,
  close,
}: {
  employee: Employee;
  initialWeek: string;
  loadWeek: (start: string) => Promise<Board>;
  close: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [start, setStart] = useState(initialWeek);
  const [data, setData] = useState<Board | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    element?.showModal();
    return () => {
      element?.close();
      previousFocus?.focus();
    };
  }, []);
  useEffect(() => {
    let current = true;
    setLoading(true);
    setError("");
    loadWeek(start)
      .then((result) => {
        if (current) setData(result);
      })
      .catch((e) => {
        if (current) setError((e as Error).message);
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [start, loadWeek, retry]);
  const person = data?.employees.find((e) => e.id === employee.id) || employee;
  const week = data?.weeks[start];
  const saved = week?.availability?.[person.id];
  const values = saved?.values || person.defaults?.values || {};
  const prefs = saved?.preferences || person.defaults?.preferences || {};
  const cook = person.skills.includes("cuisine");
  const shifts =
    week?.shifts.filter(
      (s) => !s.fixed && qualified({ ...person, active: true }, s),
    ) || [];
  const status = (s: (typeof shifts)[number]): AvailabilityState =>
    availabilityState({ values, allAvailable: saved?.allAvailable }, s);
  const counts = shifts.reduce<Record<AvailabilityState, number>>(
    (acc, s) => {
      acc[status(s)]++;
      return acc;
    },
    { available: 0, prefer_not: 0, unavailable: 0, unknown: 0 },
  );
  const imported = !!saved?.importNote;
  return (
    <dialog
      ref={dialog}
      className="lulu-availability-dialog"
      aria-labelledby="dispos-title"
      onCancel={close}
    >
      <div className="lulu-panel-head">
        <div>
          <p className="lulu-eyebrow">L’ÉQUIPE · APERÇU RAPIDE</p>
          <h2 id="dispos-title">
            {cook ? "Horaires fixes" : "Disponibilités"} · {person.name}
          </h2>
        </div>
        <button
          autoFocus
          aria-label="Fermer les disponibilités"
          onClick={close}
        >
          ×
        </button>
      </div>
      <div className="lulu-dispos-scroll">
        <div className="lulu-dispos-week">
          <button
            aria-label="Voir la semaine précédente"
            onClick={() => setStart(addDays(start, -7))}
          >
            ←
          </button>
          <label>
            Semaine du
            <input
              type="date"
              aria-label="Semaine des disponibilités"
              value={start}
              onChange={(e) =>
                e.target.value && setStart(monday(e.target.value))
              }
            />
          </label>
          <button
            aria-label="Voir la semaine suivante"
            onClick={() => setStart(addDays(start, 7))}
          >
            →
          </button>
          <span>au {dateLabel(addDays(start, 6))}</span>
        </div>
        {loading ? (
          <p className="padded" role="status">
            Chargement des disponibilités…
          </p>
        ) : error ? (
          <div className="lulu-banner error" role="alert">
            {error}
            <button onClick={() => setRetry((n) => n + 1)}>Réessayer</button>
          </div>
        ) : (
          week && (
            <>
              <div className="lulu-dispos-summary">
                <span
                  className={`lulu-status ${cook || saved?.confirmed ? "good" : ""}`}
                >
                  {cook
                    ? "Planning fixe récurrent"
                    : imported
                      ? "Prérempli pour les tests"
                      : saved?.confirmed
                        ? "Semaine confirmée"
                        : "Semaine à confirmer"}
                </span>
                <p>
                  {cook
                    ? "Ces horaires se répètent chaque semaine et ne sont pas modifiés par la génération."
                    : imported
                      ? "D’après les plannings fournis, sans confirmation personnelle du salarié."
                      : saved
                        ? "Disponibilités enregistrées pour cette semaine."
                        : "Habitudes reprises par défaut ; cette semaine n’a pas encore été confirmée."}
                </p>
                {!cook && (
                  <div className="lulu-dispos-legend">
                    {Object.entries(states).map(([s, label]) => (
                      <span key={s} className={`lulu-dispos-state ${s}`}>
                        {label} <b>{counts[s as AvailabilityState]}</b>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="lulu-dispos-grid">
                {days.map((day, index) => (
                  <section key={day} className="lulu-dispos-day">
                    <h3>
                      {day}
                      <small>
                        {dateLabel(addDays(start, index), {
                          day: "numeric",
                          month: "short",
                        })}
                      </small>
                    </h3>
                    {["midi", "soir"].map((service) => {
                      const rows = shifts.filter(
                        (s) =>
                          s.date === addDays(start, index) &&
                          s.service === service,
                      );
                      const fixed = (person.fixedShifts || []).filter(
                        (s) => s.day === index && s.service === service,
                      );
                      return (
                        <div className="lulu-dispos-service" key={service}>
                          <h4>{service === "midi" ? "Midi" : "Soir"}</h4>
                          {cook ? (
                            fixed.length ? (
                              fixed.map((s, i) => (
                                <div className="lulu-dispos-row" key={i}>
                                  <strong>
                                    {s.start} – {s.end}
                                  </strong>
                                  <span className="lulu-tag">
                                    Cuisine · fixe
                                  </span>
                                </div>
                              ))
                            ) : (
                              <small>Pas de shift fixe</small>
                            )
                          ) : rows.length ? (
                            rows.map((s) => (
                              <div
                                key={s.id}
                                className={`lulu-dispos-row ${status(s)}`}
                              >
                                <div>
                                  <strong>
                                    {s.start} – {s.end}
                                  </strong>
                                  <small>
                                    {skillNames[s.role]}
                                    {s.required.length
                                      ? ` · ${s.required.map((r) => skillNames[r]).join(", ")}`
                                      : ""}
                                  </small>
                                </div>
                                <span
                                  className={`lulu-dispos-state ${status(s)}`}
                                >
                                  {states[status(s)]}
                                </span>
                              </div>
                            ))
                          ) : (
                            <small>Aucun shift compatible prévu</small>
                          )}
                        </div>
                      );
                    })}
                  </section>
                ))}
              </div>
              {!cook && (
                <section className="lulu-dispos-prefs">
                  <h3>Préférences de la semaine</h3>
                  <div>
                    {Object.entries(preferences)
                      .filter(
                        ([name]) =>
                          (prefs[name] ?? (name === "variety" ? 1 : 0)) > 0,
                      )
                      .map(([name, label]) => (
                        <span className="lulu-tag" key={name}>
                          {label} · {prefs[name] === 2 ? "fort" : "léger"}
                        </span>
                      ))}
                    {prefs.hoursDelta ? (
                      <span className="lulu-tag">
                        Objectif souhaité : {prefs.hoursDelta > 0 ? "+" : ""}
                        {prefs.hoursDelta} h cette semaine
                      </span>
                    ) : null}
                  </div>
                  <small>
                    Ces souhaits restent souples ; les indisponibilités fermes
                    sont indiquées dans les services.
                  </small>
                </section>
              )}
            </>
          )
        )}
      </div>
      <div className="lulu-save-bar">
        <small>Consultation uniquement · aucune modification des saisies</small>
        <button onClick={close}>Fermer</button>
      </div>
    </dialog>
  );
}
