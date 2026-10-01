import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { List, X, Heart } from "@phosphor-icons/react";
import { useAuth } from "../lib/auth.jsx";
import { SITE } from "../lib/site.js";
import ThemeToggle from "./ThemeToggle.jsx";
import { useWishlist } from "../lib/store.js";
import { EASE } from "./Fun.jsx";

const link = ({ isActive }) =>
  `relative py-1 text-sm font-medium transition-colors duration-150 ${isActive ? "text-slate-900" : "text-slate-600 hover-fine:text-slate-900"}`;

/** Nav link with an underline that slides between the active links. */
function Item({ to, children, onClick, indicator = true }) {
  return (
    <NavLink to={to} className={link} onClick={onClick}>
      {({ isActive }) => (
        <>
          {children}
          {isActive && indicator && <motion.span layoutId="nav-underline" aria-hidden="true" className="absolute inset-x-0 -bottom-1 h-0.5 rounded-full bg-brand-600" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
        </>
      )}
    </NavLink>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const saved = useWishlist().slugs.length;
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const sentinel = useRef(null);
  const close = () => setOpen(false);

  // A 1px sentinel at the top of the page tells us when to draw the header edge, with no scroll listener.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const items = (indicator) => (
    <>
      <Item to="/courses" onClick={close} indicator={indicator}>Courses</Item>
      <Item to="/instructors" onClick={close} indicator={indicator}>Instructors</Item>
      <Item to="/about" onClick={close} indicator={indicator}>About</Item>
      <Item to="/portfolio" onClick={close} indicator={indicator}>Portfolio</Item>
      <Item to="/faq" onClick={close} indicator={indicator}>FAQ</Item>
      <Item to="/contact" onClick={close} indicator={indicator}>Contact</Item>
    </>
  );

  const savedLink = (
    <NavLink to="/saved" onClick={close} aria-label={saved ? `Saved courses, ${saved}` : "Saved courses"} className="relative flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-sm font-medium text-slate-700 transition-colors hover-fine:bg-slate-100">
      <Heart size={20} aria-hidden="true" />
      {saved > 0 && <span className="num text-xs font-semibold">{saved}</span>}
    </NavLink>
  );

  return (
    <>
      <div ref={sentinel} aria-hidden="true" className="absolute left-0 top-0 h-px w-px" />
      <header className={`sticky top-0 z-20 print:hidden bg-slate-50/90 backdrop-blur-sm transition-[border-color] duration-200 border-b ${scrolled || open ? "border-slate-200" : "border-transparent"}`}>
        <div className="shell flex items-center justify-between gap-4 py-3">
          <Link to="/" className="font-display text-2xl font-bold tracking-tight">{SITE.name}</Link>
          <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">{items(true)}</nav>
          <div className="hidden items-center gap-1 lg:flex">
            {savedLink}
            <ThemeToggle />
            {user ? (
              <>
                <Link to="/dashboard" className="btn btn-quiet btn-sm ml-2">Dashboard</Link>
                <Link to="/profile" className="px-3 text-sm font-medium text-slate-700">{user.full_name.split(" ")[0]}</Link>
                <button onClick={() => { nav("/"); logout(); }} className="px-1 text-sm font-medium text-slate-600 hover-fine:text-slate-900">Log out</button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-3 text-sm font-medium text-slate-700">Log in</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Sign up</Link>
              </>
            )}
          </div>
          <div className="flex items-center gap-1 lg:hidden">
            {savedLink}
            <ThemeToggle />
            <button aria-label="Menu" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(!open)} className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 active:scale-95">
              {open ? <X size={22} aria-hidden="true" /> : <List size={22} aria-hidden="true" />}
            </button>
          </div>
        </div>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div id="mobile-menu" key="menu" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2, ease: EASE }}
              className="shell flex flex-col gap-4 border-t border-slate-200 py-5 lg:hidden">
              {items(false)}
              <div className="h-px bg-slate-200" />
              {user ? (
                <>
                  <Item to="/dashboard" onClick={close} indicator={false}>Dashboard</Item>
                  <Item to="/my-courses" onClick={close} indicator={false}>My courses</Item>
                  <Item to="/payments" onClick={close} indicator={false}>Payments</Item>
                  <Item to="/profile" onClick={close} indicator={false}>Profile</Item>
                  <button onClick={() => { close(); nav("/"); logout(); }} className="text-left text-sm font-medium text-slate-600">Log out</button>
                </>
              ) : (
                <>
                  <Item to="/login" onClick={close} indicator={false}>Log in</Item>
                  <Item to="/register" onClick={close} indicator={false}>Sign up</Item>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
