import { useEffect, useState, type FormEvent } from "react";
import { type Board, addDays, dateLabel, monday, request } from "./types";
import TestsPage from "./pages/TestsPage";
import "./lulu.css";

/** Separate developer credential; never reuses a restaurant employee session. */
export default function LuluDeveloperPage() {
  const [key, setKey] = useState(
    () => sessionStorage.getItem("lulu-developer-key") || "",
  );
  const [input, setInput] = useState("");
  const [start, setStart] = useState(monday());
  const [board, setBoard] = useState<Board | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const [editorVersion, setEditorVersion] = useState(0);
  const [dirty, setDirty] = useState(false);
  function discardDraft() {
    return (
      !dirty ||
      window.confirm("Abandonner les modifications non enregistrées ?")
    );
  }
  function changeWeek(value: string) {
    if (discardDraft()) {
      setStart(value);
      setMessage("");
    }
  }
  useEffect(() => {
    const previous = document.title;
    document.title = "Lulu · Administration développeur";
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
    if (!key) return;
    let live = true;
    setBusy(true);
    setError("");
    request<Board>(`admin/?week=${start}`, key, undefined, "LuluAdmin")
      .then((result) => {
        if (live) {
          setBoard(result);
          setEditorVersion((n) => n + 1);
        }
      })
      .catch((e) => {
        if (live) {
          setError(e.message);
          if (e.status === 401 || e.status === 403) {
            sessionStorage.removeItem("lulu-developer-key");
            setKey("");
            setBoard(null);
          }
        }
      })
      .finally(() => {
        if (live) setBusy(false);
      });
    return () => {
      live = false;
    };
  }, [key, start, reload]);
  async function act(
    action: string,
    payload: Record<string, unknown> = {},
    notice = "Préférences enregistrées.",
  ) {
    if (!board || busy) return false;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      setBoard(
        await request<Board>(
          `admin/?week=${start}`,
          key,
          { action, revision: board.revision, week: start, ...payload },
          "LuluAdmin",
        ),
      );
      setMessage(notice);
      return true;
    } catch (e) {
      setError((e as Error).message);
      if ((e as { status?: number }).status === 409) setReload((n) => n + 1);
      return false;
    } finally {
      setBusy(false);
    }
  }
  function connect(e: FormEvent) {
    e.preventDefault();
    sessionStorage.setItem("lulu-developer-key", input.trim());
    setKey(input.trim());
    setInput("");
  }
  function disconnect() {
    if (!discardDraft()) return;
    sessionStorage.removeItem("lulu-developer-key");
    setKey("");
    setBoard(null);
  }
  return (
    <div className="lulu lulu-developer">
      <main className="lulu-developer-main">
        <header className="lulu-panel-head">
          <div>
            <h1>Administration développeur</h1>
            <p>Lulu la Nantaise · Tests des préférences de planification</p>
          </div>
          {key && <button onClick={disconnect}>Se déconnecter</button>}
        </header>
        {!key ? (
          <form
            className="lulu-panel lulu-developer-login padded"
            onSubmit={connect}
          >
            <h2>Accès admin</h2>
            <p className="lulu-helper">
              Cet accès est distinct des comptes de Jean-Sébastien et des
              employés.
            </p>
            <label>
              Clé développeur
              <input
                type="password"
                autoComplete="current-password"
                required
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </label>
            <button className="primary">Se connecter</button>
            {error && (
              <p role="alert" className="lulu-error-text">
                {error}
              </p>
            )}
          </form>
        ) : (
          <>
            <div className="lulu-weekbar">
              <div className="lulu-week-picker">
                <button
                  disabled={busy}
                  aria-label="Semaine précédente"
                  onClick={() => changeWeek(addDays(start, -7))}
                >
                  ←
                </button>
                <label>
                  Semaine du
                  <input
                    type="date"
                    value={start}
                    disabled={busy}
                    onChange={(e) =>
                      e.target.value && changeWeek(monday(e.target.value))
                    }
                  />
                </label>
                <button
                  disabled={busy}
                  aria-label="Semaine suivante"
                  onClick={() => changeWeek(addDays(start, 7))}
                >
                  →
                </button>
              </div>
              <span>
                {dateLabel(start)} — {dateLabel(addDays(start, 6))}
              </span>
              <button
                disabled={busy}
                onClick={() => {
                  if (discardDraft()) setReload((n) => n + 1);
                }}
              >
                Recharger
              </button>
            </div>
            {error && (
              <div className="lulu-banner error" role="alert">
                {error}
              </div>
            )}
            {message && (
              <div className="lulu-banner success" role="status">
                {message}
              </div>
            )}
            {board?.weeks[start] ? (
              <fieldset className="lulu-page-fieldset" disabled={busy}>
                <TestsPage
                  key={`${start}-${editorVersion}`}
                  board={board}
                  week={board.weeks[start]}
                  act={act}
                  busy={busy}
                  onDirtyChange={setDirty}
                />
              </fieldset>
            ) : (
              <p role="status">Chargement des données…</p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
