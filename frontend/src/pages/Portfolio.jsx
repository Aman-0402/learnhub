import { useTitle } from "../lib/hooks.js";
import { OWNER } from "../lib/site.js";
import { Avatar } from "../components/Media.jsx";
import { Reveal } from "../components/Fun.jsx";
import { CHIP_TINTS } from "../lib/colors.js";

const ROLES = [
  ["AI Trainer", "CodedevH", "Aug 2026 to now", "Teaching at Allenhouse Institute of Technology & Business School and developing AI models."],
  ["Senior IT Trainer", "Ethnotech Academy", "Jul 2025 to Jun 2026", "Taught IT courses to students."],
];

const SKILLS = [
  ["Frontend", ["React", "Next.js", "TypeScript", "Tailwind CSS"]],
  ["Backend", ["Django", "Django REST Framework", "Node.js", "WebSockets", "Celery", "Redis"]],
  ["Data and cloud", ["MySQL", "PostgreSQL", "AWS"]],
  ["Growing focus", ["AI / ML", "Generative AI"]],
];

const PROJECTS = [
  { name: "Certibyt", what: "Multi-tenant SaaS exam and proctoring platform with tab-switch detection, webcam monitoring, real-time sessions and JWT auth. 186 automated tests across 7 Django apps.", stack: "Django · React (Vite)", link: "https://certibyt.com", label: "certibyt.com" },
  { name: "ConsultMe", what: "Real-time consultancy marketplace with WebSocket chat and escrow payments.", stack: "Real-time · Payments", link: "https://consultmee.in", label: "consultmee.in" },
  { name: "ClassPulse", what: "Smart attendance: students scan a QR code that rotates every 15 seconds, so screenshots cannot be shared for proxy attendance.", stack: "React · Django · MySQL", link: "https://github.com/Aman-0402/ClassPulse", label: "View on GitHub" },
  { name: "LearnHub", what: "This site: sell online and offline classes, with batches, timetables, payments and a student area.", stack: "React · Tailwind · Django · MySQL" },
  { name: "ARX Infotech website", what: "Corporate website rebuild with a React frontend and Django backend.", stack: "React · Django" },
];

const H = ({ id, children }) => <h2 id={id} className="mb-5 font-display text-2xl font-bold">{children}</h2>;

export default function Portfolio() {
  useTitle("About me", {
    description: "Aman Raj is a Full-Stack Developer and IT Trainer in Vadodara building React and Django products and teaching web development and AI.",
    type: "profile",
    jsonLd: { "@context": "https://schema.org", "@type": "Person", name: OWNER.name, jobTitle: "Full-Stack Developer and IT Trainer", address: { "@type": "PostalAddress", addressLocality: "Vadodara", addressRegion: "Gujarat", addressCountry: "IN" }, sameAs: [OWNER.github] },
  });
  return (
    <div className="space-y-14">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-600 via-[#8b5cf6] to-coral px-6 py-12 text-white sm:px-12">
        <span aria-hidden="true" className="absolute -right-8 -top-8 h-40 w-40 animate-float-slow rounded-full bg-white/10" />
        <span aria-hidden="true" className="absolute bottom-8 right-12 h-10 w-10 animate-float rounded-2xl bg-sun" />
        <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <Avatar name={OWNER.name} size="h-28 w-28" text="text-4xl" />
          <div>
            <p className="font-bold">Hi, I am</p>
            <h1 className="font-display text-4xl font-bold sm:text-5xl">{OWNER.name}</h1>
            <p className="mt-2 max-w-xl text-lg font-semibold">Full-Stack Developer and IT Trainer in Vadodara, Gujarat. I build web products and teach people how to build them.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href="#contact" className="rounded-full bg-white px-5 py-2.5 font-bold text-[#5a2bd0] shadow-lg transition hover:-translate-y-0.5">Get in touch</a>
              <a href={OWNER.github} target="_blank" rel="noopener noreferrer" className="rounded-full border-2 border-white px-5 py-2.5 font-bold transition hover:bg-white/15">GitHub<span className="sr-only"> (opens in a new tab)</span></a>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="about">
        <H id="about">About me</H>
        <p className="max-w-3xl text-slate-700">I am from Bokaro Steel City and now based in Vadodara. I hold a B.Tech in Computer Science and Engineering from Sambalpur University Institute of Information Technology (2024, CGPA 7.86). I have always mixed building and teaching, and I take on freelance and client web work for local businesses alongside my main role. These days I am putting more of my time into AI and generative AI.</p>
      </section>

      <section aria-labelledby="work">
        <H id="work">Where I work</H>
        <ul className="grid gap-4 md:grid-cols-2">
          {ROLES.map(([role, org, when, d], i) => (
            <Reveal as="li" key={role} delay={i * 90} className="rounded-3xl border border-slate-200 bg-surface p-5">
              <h3 className="font-display text-lg font-semibold">{role}</h3>
              <p className="text-sm font-bold text-brand">{org} · {when}</p>
              <p className="mt-2 text-sm text-slate-600">{d}</p>
            </Reveal>
          ))}
        </ul>
      </section>

      <section aria-labelledby="skills">
        <H id="skills">Skills and stack</H>
        <div className="grid gap-4 sm:grid-cols-2">
          {SKILLS.map(([group, items], i) => (
            <div key={group} className="rounded-3xl border border-slate-200 bg-surface p-5">
              <h3 className="mb-3 font-display text-lg font-semibold">{group}</h3>
              <ul className="flex flex-wrap gap-2">
                {items.map((s, j) => <li key={s} className={`rounded-full px-3 py-1 text-sm font-bold text-slate-900 ${CHIP_TINTS[(i + j) % CHIP_TINTS.length]}`}>{s}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="projects">
        <H id="projects">Projects</H>
        <ul className="grid gap-5 md:grid-cols-2">
          {PROJECTS.map((p, i) => (
            <Reveal as="li" key={p.name} delay={(i % 2) * 90} className="flex flex-col rounded-3xl border border-slate-200 bg-surface p-5 transition hover:-translate-y-1 hover:shadow-lg">
              <h3 className="font-display text-xl font-semibold">{p.name}</h3>
              <p className="mt-2 flex-1 text-sm text-slate-600">{p.what}</p>
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-600">{p.stack}</p>
              {p.link && <a href={p.link} target="_blank" rel="noopener noreferrer" className="mt-2 self-start font-bold text-brand hover:underline">{p.label}<span className="sr-only"> (opens in a new tab)</span> →</a>}
            </Reveal>
          ))}
        </ul>
      </section>

      <section id="contact" aria-labelledby="contact-h" className="rounded-[2rem] bg-brand-100 px-6 py-12 text-center">
        <h2 id="contact-h" className="font-display text-3xl font-bold text-slate-900">Let us work together</h2>
        <p className="mx-auto mt-2 max-w-md font-semibold text-slate-700">Need a website, a web app or a trainer? Send me a message.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a href={`mailto:${OWNER.email}`} className="rounded-full bg-brand-600 px-6 py-3 font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-brand-700">Email me</a>
          <a href={OWNER.github} target="_blank" rel="noopener noreferrer" className="rounded-full border-2 border-brand-600 px-6 py-3 font-bold text-brand-strong hover:bg-brand-50">GitHub<span className="sr-only"> (opens in a new tab)</span></a>
        </div>
      </section>
    </div>
  );
}
