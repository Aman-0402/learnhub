import { Link } from "react-router-dom";
import { useAuth } from "../../lib/auth.jsx";
import { useFetch, useTitle } from "../../lib/hooks.js";
import { manage } from "../../lib/manage.js";
import { inr } from "../../components/CourseCard.jsx";
import PageHeader, { Card } from "../../components/PageHeader.jsx";
import { ErrorState, Loading, Skeleton } from "../../components/States.jsx";

const dateStr = (d) => new Date(d).toLocaleDateString("en-IN", { dateStyle: "medium" });
const LOW_SEATS_THRESHOLD = 3;

function Stat({ label, value, to }) {
  const body = <><p className="text-sm text-slate-600">{label}</p><p className="num mt-1 text-3xl font-semibold">{value}</p></>;
  return to ? <Link to={to} className="card block p-6 transition-colors duration-200 hover-fine:border-slate-400">{body}</Link> : <Card>{body}</Card>;
}

function RevenueTrend({ trend }) {
  const max = Math.max(...trend.map((m) => m.total), 1);
  return (
    <Card>
      <h2 className="text-lg font-semibold">Revenue, last 6 months</h2>
      <div className="mt-6 flex h-36 items-end gap-3">
        {trend.map((m) => (
          <div key={m.month} className="flex flex-1 flex-col items-center gap-2">
            <span className="num text-xs text-slate-600">{m.total > 0 ? inr(m.total) : ""}</span>
            <div className="w-full rounded-t-md bg-[var(--color-accent-fill)]" style={{ height: `${Math.max((m.total / max) * 100, m.total > 0 ? 4 : 1)}%` }} />
            <span className="text-xs text-slate-600">{m.month.split(" ")[0]}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function TopCourses({ courses }) {
  return (
    <Card>
      <h2 className="text-lg font-semibold">Top courses by revenue</h2>
      {courses.length === 0 ? <p className="mt-4 text-sm text-slate-600">No paid enrollments yet.</p> : (
        <ul className="mt-4 space-y-3">
          {courses.map((c, i) => (
            <li key={c.course_id} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate"><span className="num text-slate-500">{i + 1}.</span> {c.course_title}</span>
              <span className="num shrink-0 font-semibold">{inr(c.total)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function LowSeats({ courses }) {
  if (courses.length === 0) return null;
  return (
    <Card className="mt-4">
      <h2 className="text-lg font-semibold">Filling up</h2>
      <p className="mt-1 text-sm text-slate-600">{LOW_SEATS_THRESHOLD} or fewer seats left.</p>
      <ul className="mt-4 space-y-3">
        {courses.map((c) => (
          <li key={c.course_id} className="flex items-center justify-between gap-3 text-sm">
            <Link to={`/manage/courses/${c.course_id}`} className="link-draw min-w-0 truncate font-medium text-brand-strong">{c.course_title}</Link>
            <span className="tag shrink-0">{c.seats_left} left</span>
          </li>
        ))}
      </ul>
    </Card>
  );
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
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2"><RevenueTrend trend={data.revenue_trend} /></div>
            <TopCourses courses={data.top_courses} />
          </div>
          <LowSeats courses={data.low_seats} />
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
