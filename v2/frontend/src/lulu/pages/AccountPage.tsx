import { useState } from "react";
import { type Action } from "../types";

export default function AccountPage({
  act,
  onChanged,
}: {
  act: Action;
  onChanged: () => void;
}) {
  const [oldPin, setOldPin] = useState("");
  const [pin, setPin] = useState("");
  return (
    <div className="lulu-panel">
      <div className="lulu-panel-head">
        <h2>Changer mon PIN</h2>
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (await act("pin", { oldPin, pin }, "PIN modifié.")) onChanged();
        }}
      >
        <div className="lulu-form-grid padded">
          <label>
            PIN actuel
            <input
              type="password"
              required
              autoComplete="current-password"
              value={oldPin}
              onChange={(e) => setOldPin(e.target.value)}
            />
          </label>
          <label>
            Nouveau PIN
            <input
              type="password"
              required
              inputMode="numeric"
              autoComplete="new-password"
              pattern="[0-9]{6,12}"
              minLength={6}
              maxLength={12}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
            />
            <small>
              6 à 12 chiffres. Vous serez reconnecté avec le nouveau PIN.
            </small>
          </label>
        </div>
        <div className="lulu-save-bar">
          <button className="primary">Changer le PIN</button>
        </div>
      </form>
    </div>
  );
}
