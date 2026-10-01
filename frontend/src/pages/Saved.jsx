import { Link } from "react-router-dom";
import { fetchAllCourses } from "../lib/catalog.js";
import { useFetch, useTitle } from "../lib/hooks.js";
import { useWishlist } from "../lib/store.js";
import CourseCard from "../components/CourseCard.jsx";
import { EmptyState } from "../components/Fun.jsx";
import { CardGridSkeleton, ErrorState } from "../components/States.jsx";

export default function Saved() {
  useTitle("Saved courses", { noindex: true });
  const wish = useWishlist();
  const { data, error, loading, reload } = useFetch(() => fetchAllCourses());
  const courses = data ? wish.slugs.map((s) => data.find((c) => c.slug === s)).filter(Boolean) : [];
  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Saved courses</h1>
      <p className="mb-6 mt-1 text-sm text-slate-600">Saved on this device only. They are not linked to your account.</p>
      {loading && <CardGridSkeleton />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (courses.length === 0
        ? <EmptyState title="Nothing saved yet" action={<Link to="/courses" className="rounded-full bg-brand-600 px-5 py-2 font-bold text-white hover:bg-brand-700">Browse courses</Link>}>Tap the heart on a course to keep it here.</EmptyState>
        : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{courses.map((c) => <CourseCard key={c.id} course={c} as="h2" compare />)}</div>)}
    </div>
  );
}
