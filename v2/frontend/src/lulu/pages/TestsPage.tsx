import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { type PageProps, type Preferences, preferences } from "../types";

// Presets only replace their listed criteria; unrelated preferences are retained.
const presets: Record<string, { label: string; values: Preferences }> = {
  compact: { label: "Jours regroupés", values: { compact: 2, split: 0 } },
  lunch: {
    label: "Privilégier les midis",
    values: { evenings: 2, lunches: 0 },
  },
  evening: {
    label: "Privilégier les soirs",
    values: { lunches: 2, evenings: 0 },
  },
  noSplit: { label: "Éviter les coupures", values: { split: 2, compact: 0 } },
  stable: { label: "Horaires stables", values: { stable: 2 } },
  neutral: {
    label: "Toutes les préférences à zéro",
    values: {
      ...Object.fromEntries(Object.keys(preferences).map((k) => [k, 0])),
      hoursDelta: 0,
    },
  },
};
const columns: Record<string, string> = {
  weekends: "Éviter les week-ends",
  split: "Éviter les coupures",
  compact: "Regrouper les jours",
  evenings: "Éviter les soirs",
  lunches: "Éviter les midis",
  stable: "Horaires stables",
  variety: "Varier les collègues",
};

export default function TestsPage({
  board,
  week,
  act,
  onDirtyChange,
}: PageProps & { onDirtyChange?: (dirty: boolean) => void }) {
  const [scope, setScope] = useState<"week" | "defaults">("week");
  const employees = board.employees.filter(
    (e) => e.active && !e.skills.includes("cuisine"),
  );
  const initial = (id: number, target = scope) => {
    const e = employees.find((p) => p.id === id)!;
    const prefs =
      target === "week"
        ? week.availability?.[id]?.preferences || e.defaults?.preferences || {}
        : e.defaults?.preferences || {};
    return {
      ...Object.fromEntries(
        Object.keys(preferences).map((k) => [k, k === "variety" ? 1 : 0]),
      ),
      hoursDelta: 0,
      ...prefs,
    };
  };
  const [draft, setDraft] = useState<Record<number, Preferences>>(() =>
    Object.fromEntries(employees.map((e) => [e.id, initial(e.id)])),
  );
  const [selected, setSelected] = useState<number[]>([]);
  const [preset, setPreset] = useState("compact");
  const [filter, setFilter] = useState("");
  const [baseline, setBaseline] = useState(draft);
  const changed = employees.filter(
    (e) => JSON.stringify(draft[e.id]) !== JSON.stringify(baseline[e.id]),
  );
  useEffect(() => {
    onDirtyChange?.(changed.length > 0);
    return () => onDirtyChange?.(false);
  }, [changed.length, onDirtyChange]);
  useEffect(() => {
    if (!changed.length) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [changed.length]);
  const visible = employees.filter((e) =>
    e.name.toLocaleLowerCase("fr").includes(filter.toLocaleLowerCase("fr")),
  );
  function changeScope(next: "week" | "defaults") {
    if (
      changed.length &&
      !window.confirm("Abandonner les modifications non enregistrées ?")
    )
      return;
    const values = Object.fromEntries(
      employees.map((e) => [e.id, initial(e.id, next)]),
    );
    setScope(next);
    setDraft(values);
    setBaseline(values);
  }
  function setValue(id: number, name: string, value: number) {
    setDraft((current) => ({
      ...current,
      [id]: { ...current[id], [name]: value },
    }));
  }
  return (
    <>
      <div className="lulu-banner">
        Cette page modifie les préférences utilisées par le générateur. Les
        disponibilités, contrats, confirmations et plannings publiés restent
        inchangés. La cuisine fixe est exclue.
      </div>
      <div className="lulu-panel">
        <div className="lulu-panel-head">
          <div>
            <h2>Préférences des employés</h2>
            <p>
              {scope === "week"
                ? "Réglages propres à la semaine sélectionnée."
                : "Réglages repris dans les semaines sans préférences spécifiques."}
            </p>
          </div>
          <div className="lulu-toggle">
            <button
              className={scope === "week" ? "selected" : ""}
              onClick={() => changeScope("week")}
            >
              Cette semaine
            </button>
            <button
              className={scope === "defaults" ? "selected" : ""}
              onClick={() => changeScope("defaults")}
            >
              Habitudes
            </button>
          </div>
        </div>
        <div className="lulu-test-toolbar">
          <label>
            Rechercher un employé
            <input
              type="search"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Nom"
            />
          </label>
          <label>
            Réglage groupé
            <select value={preset} onChange={(e) => setPreset(e.target.value)}>
              {Object.entries(presets).map(([id, p]) => (
                <option key={id} value={id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <button
            disabled={!selected.length}
            onClick={() =>
              setDraft((current) => {
                const next = { ...current };
                for (const id of selected)
                  next[id] = { ...next[id], ...presets[preset].values };
                return next;
              })
            }
          >
            Appliquer à la sélection ({selected.length})
          </button>
          <span className="lulu-helper">
            0 : sans préférence · 1 : léger · 2 : fort
          </span>
        </div>
        <div className="lulu-table-scroll">
          <table className="lulu-table lulu-tests-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    aria-label="Sélectionner les employés affichés"
                    checked={
                      visible.length > 0 &&
                      visible.every((e) => selected.includes(e.id))
                    }
                    onChange={(e) =>
                      setSelected((current) =>
                        e.target.checked
                          ? [
                              ...new Set([
                                ...current,
                                ...visible.map((p) => p.id),
                              ]),
                            ]
                          : current.filter(
                              (id) => !visible.some((p) => p.id === id),
                            ),
                      )
                    }
                  />
                </th>
                <th>Employé</th>
                {Object.entries(columns).map(([key, label]) => (
                  <th key={key}>{label}</th>
                ))}
                <th>Écart souhaité (h)</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((e) => (
                <tr
                  key={e.id}
                  className={
                    changed.some((p) => p.id === e.id) ? "modified" : ""
                  }
                >
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Sélectionner ${e.name}`}
                      checked={selected.includes(e.id)}
                      onChange={(event) =>
                        setSelected((current) =>
                          event.target.checked
                            ? [...current, e.id]
                            : current.filter((id) => id !== e.id),
                        )
                      }
                    />
                  </td>
                  <td>
                    <strong>{e.name}</strong>
                    <small>
                      {e.weeklyHours} h / semaine
                      {scope === "week" && !week.availability?.[e.id]
                        ? " · Habitudes héritées"
                        : ""}
                    </small>
                  </td>
                  {Object.entries(columns).map(([key, label]) => (
                    <td key={key}>
                      <select
                        aria-label={`${e.name} : ${label}`}
                        value={draft[e.id][key]}
                        onChange={(event) =>
                          setValue(e.id, key, Number(event.target.value))
                        }
                      >
                        <option value={0}>0 — Aucun</option>
                        <option value={1}>1 — Léger</option>
                        <option value={2}>2 — Fort</option>
                      </select>
                    </td>
                  ))}
                  <td>
                    <input
                      aria-label={`${e.name} : Écart souhaité en heures`}
                      type="number"
                      min={-35}
                      max={35}
                      step={1}
                      value={draft[e.id].hoursDelta}
                      onChange={(event) =>
                        setValue(e.id, "hoursDelta", Number(event.target.value))
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visible.length && (
            <p className="padded">Aucun employé correspondant.</p>
          )}
        </div>
        <div className="lulu-save-bar">
          <p>
            {changed.length} employé(s) modifié(s)
            <small>Enregistrez avant de changer de page ou de semaine.</small>
          </p>
          <div>
            <button
              disabled={!changed.length}
              onClick={() => setDraft(structuredClone(baseline))}
            >
              Annuler les modifications
            </button>
            <button
              className="primary"
              disabled={!changed.length}
              onClick={async () => {
                if (
                  await act(
                    "test_preferences",
                    {
                      scope,
                      employees: changed.map((e) => ({
                        employeeId: e.id,
                        preferences: draft[e.id],
                      })),
                    },
                    `Préférences enregistrées pour ${changed.length} employé(s).`,
                  )
                )
                  setBaseline(structuredClone(draft));
              }}
            >
              Enregistrer les préférences
            </button>
          </div>
        </div>
      </div>
      <p className="lulu-helper">
        Les réglages groupés ne modifient que les critères indiqués. Pour tester
        le résultat, enregistrez puis ouvrez le{" "}
        <NavLink className="lulu-text-link" to="/lulu/planning">
          planning
        </NavLink>{" "}
        et générez une nouvelle proposition.
      </p>
    </>
  );
}
