import { Link } from "react-router-dom";
import { ArrowRight } from "@phosphor-icons/react";
import { useTitle } from "../lib/hooks.js";
import { Reveal } from "../components/Fun.jsx";

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
    <div className="space-y-24">
      <header className="max-w-4xl pt-6">
        <h1 className="text-5xl font-semibold leading-[1.02] sm:text-7xl">We help students learn what they care about, in the format that suits them.</h1>
      </header>
      <section aria-labelledby="values" className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
        <h2 id="values" className="text-3xl font-semibold sm:text-4xl">What we stand for</h2>
        <ul className="border-t border-slate-200">
          {values.map(([t, d], i) => (
            <Reveal as="li" key={t} delay={i * 60} className="border-b border-slate-200 py-6">
              <h3 className="text-xl font-semibold">{t}</h3><p className="mt-2 max-w-xl text-slate-600">{d}</p>
            </Reveal>
          ))}
        </ul>
      </section>
      <section aria-labelledby="how" className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
        <h2 id="how" className="text-3xl font-semibold sm:text-4xl">How it works</h2>
        <ol className="border-t border-slate-200">
          {steps.map(([t, d], i) => (
            <Reveal as="li" key={t} delay={i * 60} className="flex gap-6 border-b border-slate-200 py-6">
              <span className="num w-6 shrink-0 text-slate-500">{i + 1}</span>
              <div><h3 className="text-xl font-semibold">{t}</h3><p className="mt-1 text-slate-600">{d}</p></div>
            </Reveal>
          ))}
        </ol>
      </section>
      <section className="border-t border-slate-900 pt-10">
        <Link to="/courses" className="btn btn-primary">Browse courses <ArrowRight size={18} aria-hidden="true" /></Link>
      </section>
    </div>
  );
}
