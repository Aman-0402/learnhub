import { Link } from "react-router-dom";
import { useAuth } from "../../lib/auth.jsx";
import { useFetch, useTitle } from "../../lib/hooks.js";
import { manage } from "../../lib/manage.js";
import { inr } from "../../components/CourseCard.jsx";
import PageHeader, { Card } from "../../components/PageHeader.jsx";
import { ErrorState, Loading, Skeleton } from "../../components/States.jsx";

const dateStr = (d) => new Date(d).toLocaleDateString("en-IN", { dateStyle: "medium" });

function Stat({ label, value, to }) {
  const body = <><p className="text-sm text-slate-600">{label}</p><p className="num mt-1 text-3xl font-semibold">{value}</p></>;
  return to ? <Link to={to} className="card block p-6 transition-colors duration-200 hover-fine:border-slate-400">{body}</Link> : <Card>{body}</Card>;
}

export default function AdminHome() {
  const { user } = useAuth();
  useTitle("Admin overview", { noindex: true });
  const { data, error, loading, reload } = useFetch(() => manage.overview());

  return (
    <div>
      <PageHeader title="Overview" subtitle={`Signed in as ${user.email}.`} />
      {loading && <Loading label="Loading overview"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="card space-y-3 p-6"><Skeleton className="h-3 w-24" /><Skeleton className="h-8 w-16" /></div>)}</div></Loading>}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Students" value={data.students_count} to="/manage/users" />
            <Stat label="Active courses" value={data.active_courses} to="/manage/courses" />
            <Stat label="Pending enrollments" value={data.pending_enrollments} to="/manage/enrollments" />
            <Stat label="Revenue this month" value={inr(data.revenue_this_month)} to="/manage/enrollments" />
          </div>
          <div className="mt-10">
            <div className="mb-5 flex items-end justify-between gap-4">
              <h2 className="text-2xl font-semibold">Recent contact messages</h2>
              <Link to="/manage/contact" className="link-draw font-semibold text-brand-strong">View all{data.unhandled_messages > 0 && ` (${data.unhandled_messages} unhandled)`}</Link>
            </div>
            {data.recent_messages.length === 0
              ? <p className="text-slate-600">No messages yet.</p>
              : (
                <Card className="!p-0">
                  <ul className="divide-y divide-slate-200">
                    {data.recent_messages.map((m) => (
                      <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                        <div className="min-w-0">
                          <p className="font-medium">{m.name} <span className="font-normal text-slate-600">{m.email}</span></p>
                          <p className="text-xs text-slate-600">{dateStr(m.created_at)}</p>
                        </div>
                        <span className="tag">{m.is_handled ? "Handled" : "Unhandled"}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
          </div>
        </>
      )}
    </div>
  );
}
