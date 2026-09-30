import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";

const link = ({ isActive }) =>
  `text-sm font-medium ${isActive ? "text-brand-600" : "text-slate-600 hover:text-slate-900"}`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-xl font-bold text-brand-600">LearnHub</Link>
        <nav className="flex items-center gap-5">
          <NavLink to="/courses" className={link}>Courses</NavLink>
          {user ? (
            <>
              <NavLink to="/my-courses" className={link}>My courses</NavLink>
              <span className="hidden text-sm text-slate-500 sm:inline">{user.full_name}</span>
              <button onClick={() => { logout(); nav("/"); }} className="text-sm font-medium text-slate-600 hover:text-slate-900">
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={link}>Log in</NavLink>
              <Link to="/register" className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
