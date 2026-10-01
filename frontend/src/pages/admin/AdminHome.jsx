import { useAuth } from "../../lib/auth.jsx";
import PageHeader from "../../components/PageHeader.jsx";

export default function AdminHome() {
  const { user } = useAuth();
  return (
    <div>
      <PageHeader title="Admin" subtitle={`Signed in as ${user.email}. Management pages appear here as they are built.`} />
      <p className="max-w-xl text-slate-600">Courses, enrollments, messages and users will be added one phase at a time. Until then, Django admin at /admin on the API server still manages everything.</p>
    </div>
  );
}
