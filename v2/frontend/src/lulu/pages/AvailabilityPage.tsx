import { useState } from "react";
import {
  type PageProps,
  type Availability,
  type AvailabilityState,
  type Shift,
  addDays,
  dateLabel,
  days,
  preferences,
  qualified,
  shiftKey,
  availabilityState,
  skillNames,
  states,
} from "../types";
import { Empty } from "../ui";

export default function AvailabilityPage({ board, week, act }: PageProps) {
  const [av, setAv] = useState<Availability>(() => structuredClone(week.mine));
  const [dirty, setDirty] = useState(false);
  const [saveDefaults, setSaveDefaults] = useState(false);
  const shifts = week.shifts.filter((s) => !s.fixed && qualified(board.me, s));
  function update(next: Availability) {
    setAv({ ...next, confirmed: false });
    setDirty(true);
  }
  function change(s: Shift, value: AvailabilityState) {
    let values = { ...av.values };
    // When disabling the general toggle, preserve the other explicit available choices.
    if (av.allAvailable && value !== "available")
      for (const row of shifts)
        if (!values[shiftKey(row)]) values[shiftKey(row)] = "available";
    values[shiftKey(s)] = value;
    update({
      ...av,
      values,
      allAvailable: value === "available" ? av.allAvailable : false,
    });
  }
  const confirmed = av.confirmed && !dirty;
  return (
    <>
      <div className="lulu-availability-banner">
        <div>
          <span className={`lulu-status ${confirmed ? "good" : ""}`}>
            {confirmed
              ? "✓ Semaine confirmée"
              : dirty
                ? "Modifications non enregistrées"
                : "Semaine à confirmer"}
          </span>
          <h2>Disponibilités de {board.me.name}</h2>
          <p>
            Indiquez vos possibilités pour chaque horaire. Jean-Sébastien fera
            ensuite les affectations.
          </p>
        </div>
      </div>
      {!shifts.length ? (
        <Empty
          title="Aucun shift à renseigner."
          text="Vos compétences ou vos horaires fixes sont gérés par Jean-Sébastien dans l’équipe."
        />
      ) : (
        <>
          <div className="lulu-panel">
            <div className="lulu-panel-head">
              <div>
                <h2>Mes disponibilités</h2>
                <p>
                  Les variantes sont des alternatives : vous ne serez affecté
                  qu’une fois par service.
                </p>
              </div>
              <span className="lulu-tag">30 min de pause incluse</span>
            </div>
            <label className="lulu-check padded">
              <input
                type="checkbox"
                checked={av.allAvailable}
                onChange={(e) =>
                  update({ ...av, allAvailable: e.target.checked })
                }
              />
              <span>
                Disponible pour tous les autres shifts de cette semaine
                <small>
                  Vos indisponibilités renseignées restent prioritaires.
                </small>
              </span>
            </label>
            <div className="lulu-availability-days">
              {days.map((day, index) => (
                <section key={day}>
                  <h3>
                    {day}
                    <span>
                      {dateLabel(addDays(week.start, index), {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </h3>
                  {["midi", "soir"].map((service) => (
                    <div key={service} className="lulu-availability-service">
                      <h4>{service === "midi" ? "Midi" : "Soir"}</h4>
                      {shifts
                        .filter(
                          (s) =>
                            s.date === addDays(week.start, index) &&
                            s.service === service,
                        )
                        .map((s) => {
                          const status = availabilityState(av, s);
                          return (
                            <label
                              className={`lulu-availability-row ${status}`}
                              key={s.id}
                            >
                              <span>
                                <strong>
                                  {s.start} – {s.end}
                                </strong>
                                <small>
                                  {skillNames[s.role]}
                                  {s.required.length
                                    ? ` · ${s.required.map((r) => skillNames[r]).join(", ")}`
                                    : ""}
                                </small>
                              </span>
                              <select
                                aria-label={`${day} ${s.service} ${s.start} ${s.end} ${s.required.join(" ")}`}
                                value={status}
                                onChange={(e) =>
                                  change(s, e.target.value as AvailabilityState)
                                }
                              >
                                {Object.entries(states).map(
                                  ([value, label]) => (
                                    <option key={value} value={value}>
                                      {label}
                                    </option>
                                  ),
                                )}
                              </select>
                            </label>
                          );
                        })}
                    </div>
                  ))}
                </section>
              ))}
            </div>
          </div>
          <div className="lulu-panel">
            <div className="lulu-panel-head">
              <div>
                <h2>Préférences de planification</h2>
                <p>
                  Préférences prises en compte lors de la génération du planning.
                </p>
              </div>
            </div>
            <div className="lulu-preferences">
              {Object.entries(preferences).map(([name, label]) => (
                <label key={name}>
                  {label}
                  <select
                    value={av.preferences[name] ?? (name === "variety" ? 1 : 0)}
                    onChange={(e) =>
                      update({
                        ...av,
                        preferences: {
                          ...av.preferences,
                          [name]: Number(e.target.value),
                        },
                      })
                    }
                  >
                    <option value={0}>Sans préférence</option>
                    <option value={1}>Souhait léger</option>
                    <option value={2}>Souhait fort</option>
                  </select>
                </label>
              ))}
              <label>
                Heures souhaitées en plus / en moins
                <input
                  type="number"
                  min={-35}
                  max={35}
                  step={1}
                  value={av.preferences.hoursDelta || 0}
                  onChange={(e) =>
                    update({
                      ...av,
                      preferences: {
                        ...av.preferences,
                        hoursDelta: Number(e.target.value),
                      },
                    })
                  }
                />
                <small>
                  Par rapport à votre contrat de {board.me.weeklyHours} h ; à
                  compenser sur les autres semaines.
                </small>
              </label>
            </div>
          </div>
          <div className="lulu-save-bar">
            <label className="lulu-check">
              <input
                type="checkbox"
                checked={saveDefaults}
                onChange={(e) => setSaveDefaults(e.target.checked)}
              />
              <span>
                Utiliser ces choix comme réglages habituels
                <small>
                  Repris dans les semaines non renseignées, toujours à
                  confirmer.
                </small>
              </span>
            </label>
            <div>
              <button
                onClick={() =>
                  act(
                    "availability",
                    { availability: { ...av, confirmed: false }, saveDefaults },
                    "Brouillon enregistré. La semaine reste à confirmer.",
                  )
                }
              >
                Sauvegarder le brouillon
              </button>
              <button
                className="primary"
                onClick={() =>
                  act(
                    "availability",
                    { availability: { ...av, confirmed: true }, saveDefaults },
                    "Semaine confirmée. Jean-Sébastien a été notifié.",
                  )
                }
              >
                Confirmer ma semaine ✓
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
