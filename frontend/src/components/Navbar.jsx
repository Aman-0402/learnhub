import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import { SITE } from "../lib/site.js";
import ThemeToggle from "./ThemeToggle.jsx";
import { useWishlist } from "../lib/store.js";

const link = ({ isActive }) =>
  `text-sm font-bold ${isActive ? "text-brand" : "text-slate-600 hover:text-slate-900"}`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const saved = useWishlist().slugs.length;
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const items = (
    <>
      <NavLink to="/courses" className={link} onClick={close}>Courses</NavLink>
      <NavLink to="/instructors" className={link} onClick={close}>Instructors</NavLink>
      <NavLink to="/saved" className={link} onClick={close}>Saved{saved > 0 && <span className="ml-1.5 rounded-full bg-coral px-1.5 py-0.5 text-xs font-bold text-white"><span className="sr-only"> </span>{saved}</span>}</NavLink>
      <NavLink to="/about" className={link} onClick={close}>About</NavLink>
      <NavLink to="/portfolio" className={link} onClick={close}>Portfolio</NavLink>
      <NavLink to="/faq" className={link} onClick={close}>FAQ</NavLink>
      <NavLink to="/contact" className={link} onClick={close}>Contact</NavLink>
    </>
  );

  return (
    <header className="sticky top-0 z-20 print:hidden border-b-2 border-brand-100 bg-surface/90 backdrop-blur">
      <div className="shell flex items-center justify-between gap-4 py-3">
        <Link to="/" className="font-display text-2xl font-bold text-brand"><span aria-hidden="true" className="mr-1.5 inline-block animate-wiggle">🎓</span>{SITE.name}</Link>
        <nav aria-label="Main" className="hidden items-center gap-6 lg:flex">{items}</nav>
        <div className="hidden items-center gap-3 lg:flex">
          <ThemeToggle />
          {user ? (
            <>
              <NavLink to="/dashboard" className={link}>Dashboard</NavLink>
              <NavLink to="/profile" className={link}>{user.full_name.split(" ")[0]}</NavLink>
              <button onClick={() => { nav("/"); logout(); }} className="text-sm font-medium text-slate-600 hover:text-slate-900">Log out</button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={link}>Log in</NavLink>
              <Link to="/register" className="rounded-full bg-brand-600 px-4 py-1.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-700">Sign up</Link>
            </>
          )}
        </div>
        <div className="flex items-center gap-1 lg:hidden"><ThemeToggle />
        <button aria-label="Menu" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(!open)} className="rounded-lg p-2 text-slate-700">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button></div>
      </div>
      {open && (
        <div id="mobile-menu" className="shell flex flex-col gap-4 border-t border-slate-200 py-4 lg:hidden">
          {items}
          <div className="h-px bg-slate-200" />
          {user ? (
            <>
              <NavLink to="/dashboard" className={link} onClick={close}>Dashboard</NavLink>
              <NavLink to="/my-courses" className={link} onClick={close}>My courses</NavLink>
              <NavLink to="/payments" className={link} onClick={close}>Payments</NavLink>
              <NavLink to="/profile" className={link} onClick={close}>Profile</NavLink>
              <button onClick={() => { close(); nav("/"); logout(); }} className="text-left text-sm font-medium text-slate-600">Log out</button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={link} onClick={close}>Log in</NavLink>
              <NavLink to="/register" className={link} onClick={close}>Sign up</NavLink>
            </>
          )}
        </div>
      )}
    </header>
  );
}
