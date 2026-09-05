import { useState } from "react";
import {
  type PageProps,
  type Employee,
  dateLabel,
  hours,
  iso,
  minutes,
  monday,
} from "../types";

export default function HoursPage({ board }: PageProps) {
  const [month, setMonth] = useState(iso(new Date()).slice(0, 7));
  const [published, setPublished] = useState(false);
  const [year, monthNumber] = month.split("-").map(Number);
  const dayCount = new Date(year, monthNumber, 0).getDate();
  const starts = [
    ...new Set(
      Array.from({ length: dayCount }, (_, i) =>
        monday(`${month}-${String(i + 1).padStart(2, "0")}`),
      ),
    ),
  ];
  const weekMinutes = (e: Employee, start: string) => {
    const w = board.weeks[start];
    const rows = w ? (published ? w.published?.shifts || [] : w.shifts) : [];
    return rows
      .filter(
        (s) =>
          s.date.startsWith(month) &&
          s.assignments.some((a) => a.employeeId === e.id),
      )
      .reduce((n, s) => n + minutes(s), 0);
  };
  const missing = starts.filter(
    (s) =>
      !board.weeks[s]?.prepared || (published && !board.weeks[s].published),
  );
  return (
    <>
      <div className="lulu-toolbar">
        <label>
          Mois observé
          <input
            type="month"
            value={month}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
          />
        </label>
        <div className="lulu-toggle">
          <button
            className={!published ? "selected" : ""}
            onClick={() => setPublished(false)}
          >
            Brouillons actuels
          </button>
          <button
            className={published ? "selected" : ""}
            onClick={() => setPublished(true)}
          >
            Versions publiées
          </button>
        </div>
      </div>
      <div className="lulu-banner">
        Objectif = contrat hebdomadaire × {dayCount} jours ÷ 7. Les heures sont
        rattachées au jour de début du shift, pause de 30 minutes déduite. Le
        carnet de pointage reste la référence du réalisé.
      </div>
      {missing.length > 0 && (
        <p className="lulu-error-text">
          Mois incomplet : {missing.length} semaine(s){" "}
          {published ? "non publiée(s)" : "non préparée(s)"}. Les totaux
          affichés sont partiels.
        </p>
      )}
      <div className="lulu-panel lulu-table-scroll">
        <table className="lulu-table">
          <thead>
            <tr>
              <th>Équipe</th>
              <th>Contrat / sem.</th>
              {starts.map((s) => (
                <th key={s}>
                  Du {dateLabel(s, { day: "numeric", month: "short" })}
                  <small>Part dans le mois</small>
                </th>
              ))}
              <th>Total prévu</th>
              <th>Objectif du mois</th>
              <th>Écart</th>
            </tr>
          </thead>
          <tbody>
            {board.employees.map((e) => {
              const total = starts.reduce((n, s) => n + weekMinutes(e, s), 0);
              const target = ((e.weeklyHours || 0) * 60 * dayCount) / 7;
              return (
                <tr key={e.id}>
                  <td>
                    <strong>{e.name}</strong>
                    <small>
                      {e.skills.includes("cuisine")
                        ? "Cuisine · fixe"
                        : e.skills.includes("salle")
                          ? "Salle"
                          : "Plonge"}
                    </small>
                  </td>
                  <td>{e.weeklyHours} h</td>
                  {starts.map((s) => (
                    <td key={s}>
                      {board.weeks[s] ? hours(weekMinutes(e, s)) : "—"}
                    </td>
                  ))}
                  <td>
                    <strong>{hours(total)}</strong>
                  </td>
                  <td>{hours(target)}</td>
                  <td>
                    <span
                      className={`lulu-hour-delta ${Math.abs(total - target) < 60 ? "balanced" : ""}`}
                    >
                      {total >= target ? "+" : ""}
                      {hours(total - target)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="lulu-helper">
        La proposition équilibre le contrat sur les semaines sélectionnées. Ce
        tableau permet aussi de vérifier le mois civil, y compris ses semaines
        partielles.
      </p>
    </>
  );
}
