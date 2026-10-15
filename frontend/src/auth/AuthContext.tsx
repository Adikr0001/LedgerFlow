import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { clearSession, readSession, saveSession } from "../lib/api";
import type { AuthSession } from "../types/api";

interface AuthContextValue {
  session: AuthSession | null;
  acceptSession: (session: AuthSession) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => readSession());
  useEffect(() => {
    const clearExpiredSession = () => setSession(null);
    window.addEventListener("ledgerflow:unauthorized", clearExpiredSession);
    return () => window.removeEventListener("ledgerflow:unauthorized", clearExpiredSession);
  }, []);
  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      acceptSession: (next) => {
        saveSession(next);
        setSession(next);
      },
      signOut: () => {
        clearSession();
        setSession(null);
      },
    }),
    [session],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
