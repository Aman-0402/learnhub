import { Suspense } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { motion } from "motion/react";
import { SquaresFour, ArrowLeft, BookOpen, Tag, ChalkboardTeacher, Receipt, Envelope, Users } from "@phosphor-icons/react";
import { useTitle } from "../../lib/hooks.js";
import { useAuth } from "../../lib/auth.jsx";

// Each phase of PHASES.md adds its links here.
const LINKS = [
  { to: "/manage", label: "Overview", icon: SquaresFour, end: true },
  { to: "/manage/courses", label: "Courses", icon: BookOpen },
  { to: "/manage/subjects", label: "Subjects", icon: Tag },
  { to: "/manage/instructors", label: "Instructors", icon: ChalkboardTeacher },
  { to: "/manage/enrollments", label: "Enrollments", icon: Receipt },
  { to: "/manage/contact", label: "Contact messages", icon: Envelope },
  { to: "/manage/users", label: "Users", icon: Users },
];

const item = ({ isActive }) =>
  `relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors duration-150 ${isActive ? "text-slate-900" : "text-slate-600 hover-fine:bg-slate-100 hover-fine:text-slate-900"}`;

export default function AdminLayout() {
  useTitle("Admin", { noindex: true });
  const { user } = useAuth();
  return (
    <div className="grid gap-8 lg:grid-cols-[14rem_1fr]">
      <aside aria-label="Admin" className="lg:sticky lg:top-24 lg:self-start">
        <p className="mb-1 text-sm font-semibold">Admin</p>
        <p className="mb-4 text-xs text-slate-600">{user.role === "superadmin" ? "Super admin" : "Staff"}</p>
        <nav aria-label="Admin sections" className="flex gap-1 overflow-x-auto lg:flex-col">
          {LINKS.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={item}>
              {({ isActive }) => (
                <>
                  {isActive && <motion.span layoutId="admin-nav" aria-hidden="true" className="absolute inset-0 rounded-xl bg-slate-100" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
                  <Icon size={20} aria-hidden="true" className="relative" />
                  <span className="relative">{label}</span>
                </>
              )}
            </NavLink>
          ))}
          <NavLink to="/" className={item}><ArrowLeft size={20} aria-hidden="true" />Back to site</NavLink>
        </nav>
      </aside>
      <section aria-label="Admin content" className="min-w-0">
        <Suspense fallback={<div role="status" aria-busy="true" className="min-h-[40dvh]"><span className="sr-only">Loading</span></div>}>
          <Outlet />
        </Suspense>
      </section>
    </div>
  );
}
