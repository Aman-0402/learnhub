import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { useFetch, useTitle } from "../lib/hooks.js";
import CourseCard from "../components/CourseCard.jsx";
import { CardGridSkeleton, ErrorState } from "../components/States.jsx";

export default function Home() {
  useTitle("");
  const { data, error, loading, reload } = useFetch(() => api("/courses/", { auth: false }).then((d) => d.results.slice(0, 3)));
  return (
    <div className="space-y-12">
      <section className="rounded-2xl bg-brand-600 px-8 py-14 text-white">
        <h1 className="max-w-2xl text-4xl font-bold leading-tight">Learn online or in the classroom, across every subject.</h1>
        <p className="mt-4 max-w-xl text-white/90">Register, pick a course, pay the fee and start learning.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/courses" className="rounded-lg bg-surface px-5 py-2.5 font-semibold text-brand-strong hover:bg-brand-50">Browse courses</Link>
          <Link to="/register" className="rounded-lg border border-white/70 px-5 py-2.5 font-semibold hover:bg-white/10">Create account</Link>
        </div>
      </section>
      <section aria-labelledby="featured">
        <h2 id="featured" className="mb-4 text-xl font-semibold">Featured courses</h2>
        {loading && <CardGridSkeleton />}
        {error && <ErrorState message={error} onRetry={reload} />}
        {data && <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data.map((c) => <CourseCard key={c.id} course={c} />)}</div>}
      </section>
    </div>
  );
}
