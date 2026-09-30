import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import CourseCard from "../components/CourseCard.jsx";

export default function Home() {
  const [courses, setCourses] = useState([]);
  useEffect(() => { api("/courses/", { auth: false }).then((d) => setCourses(d.results.slice(0, 3))).catch(() => {}); }, []);
  return (
    <div className="space-y-12">
      <section className="rounded-2xl bg-brand-600 px-8 py-14 text-white">
        <h1 className="max-w-2xl text-4xl font-bold leading-tight">Learn online or in the classroom, across every subject.</h1>
        <p className="mt-4 max-w-xl text-brand-100">Register, pick a course, pay the fee and start learning.</p>
        <div className="mt-8 flex gap-3">
          <Link to="/courses" className="rounded-lg bg-white px-5 py-2.5 font-semibold text-brand-700 hover:bg-brand-50">Browse courses</Link>
          <Link to="/register" className="rounded-lg border border-white/60 px-5 py-2.5 font-semibold hover:bg-white/10">Create account</Link>
        </div>
      </section>
      {courses.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">Featured courses</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => <CourseCard key={c.id} course={c} />)}
          </div>
        </section>
      )}
    </div>
  );
}
