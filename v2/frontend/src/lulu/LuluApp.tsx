import { useCallback, useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { type Board, addDays, dateLabel, monday, request } from "./types";
import { Brand } from "./ui";
import Login from "./Login";
import PlanningPage from "./pages/PlanningPage";
import AvailabilityPage from "./pages/AvailabilityPage";
import NeedsPage from "./pages/NeedsPage";
import TeamPage from "./pages/TeamPage";
import HoursPage from "./pages/HoursPage";
import RulesPage from "./pages/RulesPage";
import NotificationsPage from "./pages/NotificationsPage";
import AccountPage from "./pages/AccountPage";
import "./lulu.css";

export default function LuluApp() {
  const [token, setToken] = useState(
    () => sessionStorage.getItem("lulu-token") || "",
  );
  const [board, setBoard] = useState<Board | null>(null);
  const [weekStart, setWeekStart] = useState(monday());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reload, setReload] = useState(0);
  const loadTeamWeek = useCallback(
    (start: string) => request<Board>(`board/?week=${start}`, token),
    [token],
  );
  const path = useLocation().pathname.split("/")[2] || "planning";
  useEffect(() => {
    const previous = document.title;
    document.title = "Lulu la Nantaise · Le planning";
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => {
      document.title = previous;
      meta.remove();
    };
  }, []);
  useEffect(() => {
    if (!token) return;
    let alive = true;
    setBusy(true);
    setError("");
    request<Board>(`board/?week=${weekStart}`, token)
      .then((data) => {
        if (alive) setBoard(data);
      })
      .catch((e) => {
        if (!alive) return;
        setError(e.message);
        if (e.status === 401 || e.status === 403) {
          sessionStorage.removeItem("lulu-token");
          setToken("");
          setBoard(null);
        }
      })
      .finally(() => {
        if (alive) setBusy(false);
      });
    return () => {
      alive = false;
    };
  }, [token, weekStart, reload]);
  async function act(
    action: string,
    payload: Record<string, unknown> = {},
    message = "Modifications enregistrées.",
  ) {
    if (!board || busy) return false;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const updated = await request<Board>(`board/?week=${weekStart}`, token, {
        action,
        revision: board.revision,
        week: weekStart,
        ...payload,
      });
      setBoard(updated);
      setNotice(message);
      return true;
    } catch (e) {
      setError((e as Error).message);
      const status = (e as { status?: number }).status;
      if (status === 401 || (status === 403 && action !== "employee")) {
        sessionStorage.removeItem("lulu-token");
        setToken("");
        setBoard(null);
      }
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function signOut() {
    try {
      await request("logout/", token, {});
    } catch {
      // Remove the local session even if the server is temporarily unreachable.
    } finally {
      sessionStorage.removeItem("lulu-token");
      setToken("");
      setBoard(null);
    }
  }
  if (!token)
    return (
      <Login
        onLogin={(value) => {
          sessionStorage.setItem("lulu-token", value);
          setToken(value);
        }}
      />
    );
  if (!board || !board.weeks[weekStart])
    return (
      <div className="lulu lulu-loading">
        <Brand />
        <p>{error || "On prépare votre espace…"}</p>
        <button onClick={() => setReload((r) => r + 1)}>Réessayer</button>
        <button onClick={signOut}>Se déconnecter</button>
      </div>
    );
  const week = board.weeks[weekStart];
  const manager = board.me.manager;
  const unread = board.notifications.filter((n) => !n.read).length;
  const titles: Record<string, [string, string]> = {
    planning: [
      "Une belle semaine, ensemble.",
      "Le planning de toute l’équipe, service par service.",
    ],
    disponibilites: [
      "Votre semaine, à votre rythme.",
      "Choisissez vos disponibilités et ce qui compte pour vous.",
    ],
    besoins: [
      "Le bon monde, au bon service.",
      "Préparez les postes à couvrir, les horaires et les compétences.",
    ],
    equipe: [
      "Les visages de Lulu.",
      "Contrats, compétences et horaires fixes de la cuisine.",
    ],
    heures: [
      "Gardons le bon équilibre.",
      "Les heures prévues, semaine après semaine, face aux contrats.",
    ],
    notifications: [
      "Quoi de neuf chez Lulu ?",
      "Les confirmations, rappels et publications de votre équipe.",
    ],
    reglages: [
      "Les règles du planning.",
      "Les limites communes utilisées pour les propositions.",
    ],
    compte: [
      "Votre accès personnel.",
      "Choisissez un PIN que vous seul connaissez.",
    ],
  };
  const title = titles[path] || titles.planning;
  const props = { board, week, act, busy };
  return (
    <div className="lulu lulu-shell">
      <aside className="lulu-sidebar">
        <Brand />
        <div className="lulu-workspace">
          LA MAISON <strong>Lulu la Nantaise</strong>
          <span>Notre carnet d’équipe</span>
        </div>
        <nav aria-label="Espace Lulu">
          <NavLink aria-label="Planning" to="/lulu/planning">
            ▦ <span>Planning</span>
          </NavLink>
          <NavLink aria-label="Mes disponibilités" to="/lulu/disponibilites">
            ◷ <span>Mes disponibilités</span>
          </NavLink>
          {manager && (
            <>
              <div className="lulu-nav-caption">ORGANISER</div>
              <NavLink aria-label="Besoins des services" to="/lulu/besoins">
                ☷ <span>Besoins des services</span>
              </NavLink>
              <NavLink aria-label="Équipe" to="/lulu/equipe">
                ♧ <span>Équipe</span>
              </NavLink>
              <NavLink aria-label="Équilibre des heures" to="/lulu/heures">
                ◴ <span>Équilibre des heures</span>
              </NavLink>
              <NavLink aria-label="Règles" to="/lulu/reglages">
                ⚙ <span>Règles</span>
              </NavLink>
            </>
          )}
          <NavLink aria-label="Notifications" to="/lulu/notifications">
            ♢ <span>Notifications</span>
            {unread > 0 && <b className="lulu-count">{unread}</b>}
          </NavLink>
        </nav>
        <div className="lulu-sidebar-note">
          Un peu d’organisation.
          <br />
          <em>Beaucoup d’esprit d’équipe.</em>
        </div>
        <div className="lulu-user">
          <span className="lulu-avatar">{board.me.name.slice(0, 1)}</span>
          <div>
            <NavLink to="/lulu/compte">
              <strong>{board.me.name}</strong>
            </NavLink>
            <small>
              {manager ? "Responsable du planning" : "L’équipe de Lulu"}
            </small>
          </div>
          <button
            title="Se déconnecter"
            aria-label="Se déconnecter"
            onClick={signOut}
          >
            ↗
          </button>
        </div>
      </aside>
      <main className="lulu-main">
        <div className="lulu-topline">
          <span>
            LULU LA NANTAISE <span className="lulu-dot">/</span>{" "}
            {manager ? "ESPACE RESPONSABLE" : "ESPACE ÉQUIPE"}
          </span>
          <span className="lulu-tag">Prototype privé</span>
        </div>
        <header className="lulu-heading">
          <div>
            <p className="lulu-eyebrow">LE CARNET DE LULU</p>
            <h1>{title[0]}</h1>
            <p>{title[1]}</p>
          </div>
          <div className="lulu-flower" aria-hidden="true">
            ✳
          </div>
        </header>
        {["planning", "disponibilites", "besoins"].includes(path) && (
          <div className="lulu-weekbar">
            <div className="lulu-week-picker">
              <button
                aria-label="Semaine précédente"
                disabled={busy}
                onClick={() => setWeekStart(addDays(weekStart, -7))}
              >
                ←
              </button>
              <label>
                Semaine du{" "}
                <input
                  aria-label="Choisir une semaine"
                  type="date"
                  value={weekStart}
                  disabled={busy}
                  onChange={(e) =>
                    e.target.value && setWeekStart(monday(e.target.value))
                  }
                />
              </label>
              <button
                aria-label="Semaine suivante"
                disabled={busy}
                onClick={() => setWeekStart(addDays(weekStart, 7))}
              >
                →
              </button>
            </div>
            <span>
              {dateLabel(weekStart)} —{" "}
              {dateLabel(addDays(weekStart, 6), {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            <button
              className="lulu-link-button"
              onClick={() => setWeekStart(monday())}
            >
              Aujourd’hui
            </button>
          </div>
        )}
        {error && (
          <div className="lulu-banner error" role="alert">
            {error}
            <button
              onClick={() => {
                setReload((r) => r + 1);
                setNotice("");
              }}
            >
              Recharger les données
            </button>
          </div>
        )}
        {notice && (
          <div className="lulu-banner success" role="status">
            ✓ {notice}
            <button
              aria-label="Fermer le message"
              onClick={() => setNotice("")}
            >
              ×
            </button>
          </div>
        )}
        <fieldset className="lulu-page-fieldset" disabled={busy}>
          {path === "disponibilites" ? (
            <AvailabilityPage
              key={`${weekStart}-${board.revision}`}
              {...props}
            />
          ) : path === "besoins" && manager ? (
            <NeedsPage key={`${weekStart}-${board.revision}`} {...props} />
          ) : path === "equipe" && manager ? (
            <TeamPage {...props} loadWeek={loadTeamWeek} />
          ) : path === "heures" && manager ? (
            <HoursPage {...props} />
          ) : path === "reglages" && manager ? (
            <RulesPage key={board.revision} {...props} />
          ) : path === "notifications" ? (
            <NotificationsPage {...props} />
          ) : path === "compte" ? (
            <AccountPage act={act} onChanged={signOut} />
          ) : (
            <PlanningPage {...props} />
          )}
        </fieldset>
        <footer className="lulu-footer">
          <span>Lulu la Nantaise · Le planning qui rassemble.</span>
          <span>Heures prévisionnelles · 30 min de pause par service</span>
        </footer>
      </main>
    </div>
  );
}
