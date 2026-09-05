import { useState } from "react";
import { type PageProps } from "../types";

export default function RulesPage({ board, act }: PageProps) {
  const [rules, setRules] = useState(board.rules);
  const labels: Record<string, string> = {
    maxDailyHours: "Maximum d’heures nettes par jour",
    maxWeeklyHours: "Maximum d’heures nettes par semaine",
    minRestHours: "Repos minimum entre deux journées (h)",
    maxDaysPerWeek: "Maximum de jours travaillés par semaine",
  };
  return (
    <div className="lulu-panel">
      <div className="lulu-panel-head">
        <div>
          <h2>Les limites communes</h2>
          <p>
            Paramètres de prototype à faire valider par le responsable selon les
            contrats et les règles applicables.
          </p>
        </div>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void act(
            "rules",
            { rules },
            "Règles enregistrées. Les alertes ont été recalculées.",
          );
        }}
      >
        <div className="lulu-preferences">
          {Object.entries(labels).map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                type="number"
                required
                min={key === "minRestHours" ? 0 : 1}
                max={
                  key === "maxDaysPerWeek"
                    ? 7
                    : key === "maxDailyHours"
                      ? 16
                      : key === "maxWeeklyHours"
                        ? 84
                        : 24
                }
                step={key === "maxDaysPerWeek" ? 1 : 0.5}
                value={rules[key]}
                onChange={(e) =>
                  setRules({ ...rules, [key]: Number(e.target.value) })
                }
              />
            </label>
          ))}
        </div>
        <div className="lulu-save-bar">
          <p className="lulu-helper">
            Le générateur respecte ces limites et signale les conflits des
            horaires fixes. Il ne remplace pas la validation du responsable.
          </p>
          <button className="primary">Enregistrer les règles</button>
        </div>
      </form>
    </div>
  );
}
