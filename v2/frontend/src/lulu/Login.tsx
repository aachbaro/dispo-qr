import { useEffect, useState, type FormEvent } from "react";
import { type Employee, request } from "./types";
import { Brand } from "./ui";

export default function Login({
  onLogin,
}: {
  onLogin: (token: string) => void;
}) {
  const [people, setPeople] = useState<Employee[]>([]);
  const [id, setId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    request<{ employees: Employee[] }>("people/", "")
      .then((data) => {
        setPeople(data.employees);
        setLoaded(true);
      })
      .catch(() =>
        setError(
          "Le serveur est indisponible. Vérifiez son démarrage puis rechargez la page.",
        ),
      );
  }, []);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await request<{ token: string }>("login/", "", {
        employeeId: Number(id),
        pin,
      });
      onLogin(data.token);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="lulu lulu-login">
      <section className="lulu-login-story">
        <Brand />
        <div>
          <p className="lulu-eyebrow">BIENVENUE DANS LE CARNET D’ÉQUIPE</p>
          <h1>
            Les bons moments
            <br />
            commencent par
            <br />
            <em>une bonne équipe.</em>
          </h1>
          <p>
            Nos services, nos envies, notre équilibre.
            <br />
            Tout le monde a sa place chez Lulu.
          </p>
        </div>
        <span>LA CRÊPERIE · L’ÉQUIPE · LE PLANNING</span>
        <div className="lulu-login-flower" aria-hidden="true">
          ✳
        </div>
      </section>
      <section className="lulu-login-form">
        <div>
          <span className="lulu-tag">Espace privé · Lulu la Nantaise</span>
          <h2>Bonjour, vous !</h2>
          <p>Retrouvez votre planning et préparez vos prochaines semaines.</p>
          <form onSubmit={submit}>
            <label>
              Votre prénom
              <select
                required
                value={id}
                onChange={(e) => setId(e.target.value)}
              >
                <option value="">Choisir mon nom</option>
                {people.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Votre code PIN
              <input
                autoComplete="current-password"
                required
                type="password"
                inputMode="numeric"
                pattern="[0-9]{6,12}"
                minLength={6}
                maxLength={12}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Votre code personnel"
              />
            </label>
            {error && (
              <p className="lulu-error-text" role="alert">
                {error}
              </p>
            )}
            {loaded && !people.length && (
              <p className="lulu-error-text">
                L’espace n’a pas encore été initialisé. Le responsable doit
                créer les premiers accès.
              </p>
            )}
            <button className="primary" disabled={busy || !people.length}>
              {busy ? "Connexion…" : "Entrer dans mon espace →"}
            </button>
          </form>
          <small>
            Un oubli de PIN ? Demandez à Jean-Sébastien de le réinitialiser.
          </small>
        </div>
      </section>
    </div>
  );
}
