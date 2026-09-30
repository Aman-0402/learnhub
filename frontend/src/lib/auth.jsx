import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, tokens } from "./api.js";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!tokens.access);
  const [loggedOut, setLoggedOut] = useState(false); // true after a deliberate logout

  useEffect(() => {
    if (!tokens.access) return;
    api("/auth/me/").then(setUser).catch(() => tokens.clear()).finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const t = await api("/auth/login/", { method: "POST", body: { email, password }, auth: false });
    tokens.set(t);
    setUser(await api("/auth/me/"));
    setLoggedOut(false);
  }, []);

  const register = useCallback(async (form) => {
    const r = await api("/auth/register/", { method: "POST", body: form, auth: false });
    tokens.set({ access: r.access, refresh: r.refresh });
    setUser(r.user);
    setLoggedOut(false);
  }, []);

  const logout = useCallback(() => { tokens.clear(); setLoggedOut(true); setUser(null); }, []);

  return <AuthCtx.Provider value={{ user, loading, loggedOut, login, register, logout, setUser }}>{children}</AuthCtx.Provider>;
}
