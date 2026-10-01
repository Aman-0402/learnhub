import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";

/** Like RequireAuth, but only for staff and super admins. Students are sent to their dashboard. */
export default function RequireStaff({ children }) {
  const { user, loading, loggedOut } = useAuth();
  const loc = useLocation();
  if (loading) return <p role="status" className="text-slate-600">Loading...</p>;
  if (!user) return loggedOut ? <Navigate to="/" replace /> : <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  if (user.role !== "staff" && user.role !== "superadmin") return <Navigate to="/dashboard" replace />;
  return children;
}
