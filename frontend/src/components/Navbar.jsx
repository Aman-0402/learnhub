import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import { SITE } from "../lib/site.js";

const link = ({ isActive }) =>
  `text-sm font-medium ${isActive ? "text-brand-600" : "text-slate-600 hover:text-slate-900"}`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const items = (
    <>
      <NavLink to="/courses" className={link} onClick={close}>Courses</NavLink>
      <NavLink to="/instructors" className={link} onClick={close}>Instructors</NavLink>
      <NavLink to="/about" className={link} onClick={close}>About</NavLink>
      <NavLink to="/faq" className={link} onClick={close}>FAQ</NavLink>
      <NavLink to="/contact" className={link} onClick={close}>Contact</NavLink>
    </>
  );

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="text-xl font-bold text-brand-600">{SITE.name}</Link>
        <nav className="hidden items-center gap-6 md:flex">{items}</nav>
        <div className="hidden items-center gap-4 md:flex">
          {user ? (
            <>
              <NavLink to="/dashboard" className={link}>Dashboard</NavLink>
              <NavLink to="/profile" className={link}>{user.full_name.split(" ")[0]}</NavLink>
              <button onClick={() => { nav("/"); logout(); }} className="text-sm font-medium text-slate-600 hover:text-slate-900">Log out</button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={link}>Log in</NavLink>
              <Link to="/register" className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">Sign up</Link>
            </>
          )}
        </div>
        <button aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)} className="rounded-lg p-2 text-slate-700 md:hidden">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>
      {open && (
        <div className="flex flex-col gap-4 border-t border-slate-200 px-4 py-4 md:hidden">
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
