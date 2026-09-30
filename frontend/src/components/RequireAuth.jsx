import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";

export default function RequireAuth({ children }) {
  const { user, loading, loggedOut } = useAuth();
  const loc = useLocation();
  if (loading) return <p className="text-slate-500">Loading…</p>;
  if (!user) {
    // After a deliberate logout go home; otherwise send to login and come back afterwards.
    return loggedOut ? <Navigate to="/" replace /> : <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }
  return children;
}
