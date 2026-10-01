import { Link } from "react-router-dom";
import { useTitle } from "../lib/hooks.js";
import PageHeader, { Card } from "../components/PageHeader.jsx";

const values = [
  ["Learn your way", "Attend classes online from home, in person at our centre, or mix both."],
  ["Clear, fair fees", "Every course shows its full fee up front. Pay once and you are enrolled."],
  ["Teachers who care", "Small batches and instructors who know your name and your goals."],
];
const steps = [
  ["Create an account", "Sign up with your email in under a minute."],
  ["Choose a course", "Filter by subject and by online or offline format."],
  ["Pay and start", "Pay the course fee and find it in your dashboard right away."],
];

export default function About() {
  useTitle("About", { description: "LearnHub helps students learn the subjects they care about, online, in person or both, with clear fees and small batches." });
  return (
    <div className="space-y-14">
      <PageHeader title="About LearnHub" subtitle="We help students learn the subjects they care about, in the format that suits them." />
      <section className="grid gap-5 md:grid-cols-3">
        {values.map(([t, d]) => (
          <Card key={t}><h2 className="font-semibold">{t}</h2><p className="mt-2 text-sm text-slate-600">{d}</p></Card>
        ))}
      </section>
      <section>
        <h2 className="mb-5 text-xl font-semibold">How it works</h2>
        <ol className="grid gap-5 md:grid-cols-3">
          {steps.map(([t, d], i) => (
            <li key={t} className="flex gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-strong">{i + 1}</span>
              <div><p className="font-semibold">{t}</p><p className="text-sm text-slate-600">{d}</p></div>
            </li>
          ))}
        </ol>
      </section>
      <section className="rounded-2xl bg-brand-50 px-8 py-10 text-center">
        <h2 className="text-2xl font-bold">Ready to start learning?</h2>
        <Link to="/courses" className="mt-5 inline-block rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700">Browse courses</Link>
      </section>
    </div>
  );
}
