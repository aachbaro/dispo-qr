/**
 * src/context/UserContext.tsx
 * Layer  : Frontend — contexte global
 * Role   : Fournit l'état de l'utilisateur connecté à toute l'application.
 *          Persiste en localStorage (slug + token inclus).
 *          Expose setUser et clearUser.
 */

import { createContext, useContext, useState, type ReactNode } from "react";
import type { AuthUser } from "../types";

interface UserContextValue {
  user: AuthUser | null;
  setUser: (user: AuthUser) => void;
  clearUser: () => void;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

const STORAGE_KEY = "eb_user";

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(loadUser);

  function setUser(next: AuthUser) {
    setUserState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function clearUser() {
    setUserState(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <UserContext.Provider value={{ user, setUser, clearUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext(): UserContextValue {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUserContext must be used inside UserProvider.");
  return context;
}
