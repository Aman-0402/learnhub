import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useScroll, useSpring, useTransform, useReducedMotion } from "motion/react";
import { ArrowRight, ArrowUpRight } from "@phosphor-icons/react";
import { api } from "../lib/api.js";
import { fetchAllCourses } from "../lib/catalog.js";
import { useFetch, useTitle } from "../lib/hooks.js";
import { SITE } from "../lib/site.js";
import CourseCard, { inr, ModeBadge } from "../components/CourseCard.jsx";
import { Avatar, CourseThumb } from "../components/Media.jsx";
import { EASE, Reveal } from "../components/Fun.jsx";
import { CardGridSkeleton, ErrorState, Skeleton } from "../components/States.jsx";

const STEPS = [
  ["Create your account", "Sign up with your email. It takes under a minute."],
  ["Pick a course", "Filter by subject, format, price and start date."],
  ["Choose a batch and pay", "Select a weekly slot that suits you, then pay the fee."],
  ["Start learning", "Open your course space, follow the timetable and finish the lessons."],
];

const line = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } };

/** Three real courses stacked, drifting a few pixels with the pointer. Decorative copy of the featured list. */
function HeroStack({ courses }) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0), my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 120, damping: 20 }), sy = useSpring(my, { stiffness: 120, damping: 20 });
  const layer = (d) => ({ x: useTransform(sx, (v) => v * d), y: useTransform(sy, (v) => v * d * 0.6) }); // eslint-disable-line react-hooks/rules-of-hooks
  const l1 = layer(8), l2 = layer(16), l3 = layer(26);
  const move = (e) => {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const leave = () => { mx.set(0); my.set(0); };
  const layers = [l1, l2, l3];
  const offsets = ["lg:left-0 lg:top-4", "lg:left-20 lg:top-36", "lg:left-8 lg:top-[17rem]"];
  return (
    <div aria-hidden="true" onPointerMove={move} onPointerLeave={leave} className="relative hidden h-[28rem] lg:block">
      {courses.slice(0, 3).map((c, i) => (
        <motion.div key={c.id} style={layers[i]} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE, delay: 0.25 + i * 0.1 }}
          className={`card absolute w-[min(22rem,90%)] overflow-hidden ${offsets[i]}`}>
          <div className="flex items-center gap-4 p-3">
            <div className="w-24 shrink-0 overflow-hidden rounded-xl"><CourseThumb course={c} className="h-20" compact /></div>
            <div className="min-w-0">
              <p className="truncate font-display font-semibold">{c.title}</p>
              <p className="mt-0.5 text-sm text-slate-600">{c.mode_display}, {c.duration_weeks} weeks</p>
              <p className="num mt-1 text-sm font-semibold">{inr(c.fee)}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function FeaturedLarge({ course }) {
  return (
    <Link to={`/courses/${course.slug}`} className="group card flex h-full flex-col overflow-hidden transition-colors duration-300 hover-fine:border-slate-400">
      <CourseThumb course={course} className="h-44 lg:h-56" />
      <div className="flex flex-1 flex-col p-6 lg:p-8">
        <div className="flex"><ModeBadge label={course.mode_display} /></div>
        <h3 className="mt-3 text-2xl font-semibold leading-tight lg:text-3xl">{course.title}</h3>
        <p className="mt-3 line-clamp-3 max-w-xl text-slate-600">{course.description}</p>
        <div className="mt-auto flex items-center justify-between pt-6">
          <span className="num text-xl font-semibold">{inr(course.fee)}</span>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-strong">View course <ArrowUpRight size={16} aria-hidden="true" className="transition-transform duration-200 group-hover-fine:translate-x-0.5 group-hover-fine:-translate-y-0.5" /></span>
        </div>
      </div>
    </Link>
  );
}

function HowItWorks() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 70%", "end 60%"] });
  const grow = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });
  return (
    <ol ref={ref} className="relative max-w-2xl">
      <span aria-hidden="true" className="absolute bottom-3 left-[1.1rem] top-3 w-px bg-slate-200" />
      <motion.span aria-hidden="true" style={{ scaleY: grow }} className="absolute bottom-3 left-[1.1rem] top-3 w-px origin-top bg-brand-600" />
      {STEPS.map(([t, d], i) => (
        <Reveal as="li" key={t} className="relative flex gap-6 pb-10 last:pb-0">
          <span className="num relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-slate-50 text-sm font-semibold">{i + 1}</span>
          <div className="pt-1"><h3 className="text-xl font-semibold">{t}</h3><p className="mt-1 text-slate-600">{d}</p></div>
        </Reveal>
      ))}
    </ol>
  );
}

export default function Home() {
  useTitle("", {
    jsonLd: { "@context": "https://schema.org", "@graph": [
      { "@type": "EducationalOrganization", name: SITE.name, url: SITE.url, logo: `${SITE.url}/og-image.png`, description: "Online and offline classes across many subjects." },
      { "@type": "WebSite", name: SITE.name, url: SITE.url },
    ] },
  });
  const courses = useFetch(() => fetchAllCourses());
  const subjects = useFetch(() => api("/subjects/", { auth: false }));
  const instructors = useFetch(() => api("/instructors/", { auth: false }));

  const all = courses.data || [];
  const subjectList = subjects.data?.results || subjects.data || [];
  const instructorList = instructors.data?.results || instructors.data || [];
  const countFor = (slug) => all.filter((c) => c.subject.slug === slug).length;
  const featured = all.slice(0, 3);

  return (
    <div className="space-y-28 pb-8">
      <section className="grid items-center gap-12 pt-6 lg:grid-cols-[1.15fr_1fr] lg:pt-14">
        <motion.div initial="hidden" animate="show" transition={{ staggerChildren: 0.07 }}>
          <motion.h1 variants={line} className="max-w-3xl text-5xl font-semibold leading-[1.02] sm:text-7xl">Choose a batch. Start the class.</motion.h1>
          <motion.p variants={line} className="mt-6 max-w-xl text-lg text-slate-600">Live classes online and in person, across many subjects. Create an account, pick a batch, pay the fee.</motion.p>
          <motion.div variants={line} className="mt-9 flex flex-wrap gap-3">
            <Link to="/courses" className="btn btn-primary">Browse courses <ArrowRight size={18} aria-hidden="true" /></Link>
            <Link to="/register" className="btn btn-quiet">Create account</Link>
          </motion.div>
          {all.length > 0 && (
            <motion.p variants={line} className="mt-10 text-sm text-slate-600">
              <span className="num font-semibold text-slate-900">{all.length}</span> courses in <span className="num font-semibold text-slate-900">{subjectList.length}</span> subjects, taught by <span className="num font-semibold text-slate-900">{instructorList.length}</span> instructors.
            </motion.p>
          )}
        </motion.div>
        {courses.data ? <HeroStack courses={featured} /> : <div className="hidden h-[28rem] lg:block"><Skeleton className="h-24 w-[22rem]" /></div>}
      </section>

      {subjectList.length > 0 && (
        <section aria-labelledby="subjects">
          <h2 id="subjects" className="mb-8 text-3xl font-semibold sm:text-4xl">Subjects</h2>
          <ul className="border-t border-slate-200">
            {subjectList.map((s) => {
              const n = countFor(s.slug);
              return (
                <li key={s.id} className="border-b border-slate-200">
                  <Link to={`/courses?subject=${s.slug}`} className="group flex items-center justify-between gap-4 py-5 transition-[padding] duration-300 [transition-timing-function:var(--ease-out-strong)] hover-fine:pl-3">
                    <span className="font-display text-2xl font-semibold sm:text-4xl">{s.name}</span>
                    <span className="flex items-center gap-4 text-slate-600">
                      <span className="num text-sm">{courses.data ? `${n} ${n === 1 ? "course" : "courses"}` : ""}</span>
                      <ArrowRight size={22} aria-hidden="true" className="text-slate-400 transition-[transform,color] duration-300 group-hover-fine:translate-x-1 group-hover-fine:text-brand" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section aria-labelledby="featured">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 id="featured" className="text-3xl font-semibold sm:text-4xl">Open for enrollment</h2>
          <Link to="/courses" className="link-draw shrink-0 font-semibold text-brand-strong">See all courses</Link>
        </div>
        {courses.loading && <CardGridSkeleton count={3} />}
        {courses.error && <ErrorState message={courses.error} onRetry={courses.reload} />}
        {courses.data && featured.length > 0 && (
          <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
            <Reveal className="lg:row-span-2"><FeaturedLarge course={featured[0]} /></Reveal>
            {featured.slice(1).map((c, i) => <Reveal key={c.id} delay={(i + 1) * 70}><CourseCard course={c} /></Reveal>)}
          </div>
        )}
      </section>

      <section aria-labelledby="how" className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
        <h2 id="how" className="text-3xl font-semibold sm:text-4xl lg:sticky lg:top-24 lg:self-start">From sign-up to first class</h2>
        <HowItWorks />
      </section>

      {instructorList.length > 0 && (
        <section aria-labelledby="teachers">
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 id="teachers" className="text-3xl font-semibold sm:text-4xl">Your instructors</h2>
            <Link to="/instructors" className="link-draw shrink-0 font-semibold text-brand-strong">All instructors</Link>
          </div>
          <ul className="grid gap-x-8 sm:grid-cols-2">
            {instructorList.slice(0, 4).map((t) => (
              <li key={t.id} className="border-t border-slate-200">
                <Link to={`/instructors/${t.slug}`} className="group flex items-center gap-4 py-5">
                  <Avatar name={t.name} photo={t.photo_url} />
                  <span className="min-w-0 flex-1"><span className="block font-display text-lg font-semibold">{t.name}</span><span className="line-clamp-1 text-sm text-slate-600">{t.headline}</span></span>
                  <ArrowUpRight size={20} aria-hidden="true" className="text-slate-400 transition-[transform,color] duration-200 group-hover-fine:-translate-y-0.5 group-hover-fine:translate-x-0.5 group-hover-fine:text-brand" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="start" className="border-t border-slate-900 pt-12">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <h2 id="start" className="max-w-xl text-4xl font-semibold sm:text-6xl">Your first class is one sign-up away.</h2>
          <Link to="/register" className="btn btn-primary">Create account <ArrowRight size={18} aria-hidden="true" /></Link>
        </Reveal>
      </section>
    </div>
  );
}
