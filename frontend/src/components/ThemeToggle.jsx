import { Moon, Sun } from "@phosphor-icons/react";
import { useTheme } from "../lib/theme.jsx";

export default function ThemeToggle() {
  const { dark, toggle } = useTheme();
  return (
    <button onClick={toggle} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} aria-pressed={dark}
      className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 transition-[background-color,transform] duration-150 active:scale-95 hover-fine:bg-slate-100">
      {dark ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
    </button>
  );
}
