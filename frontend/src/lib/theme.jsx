import { createContext, useContext, useEffect, useState, useCallback } from "react";

const ThemeCtx = createContext({ dark: false, toggle() {} });
export const useTheme = () => useContext(ThemeCtx);

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  useEffect(() => { document.documentElement.classList.toggle("dark", dark); }, [dark]);
  const toggle = useCallback(() => {
    setDark((d) => {
      try { localStorage.setItem("theme", d ? "light" : "dark"); } catch {}
      return !d;
    });
  }, []);
  return <ThemeCtx.Provider value={{ dark, toggle }}>{children}</ThemeCtx.Provider>;
}
