import { useTitle } from "../lib/hooks.js";
import { OWNER } from "../lib/site.js";
import { Avatar } from "../components/Media.jsx";
import { Reveal } from "../components/Fun.jsx";
import { ArrowUpRight, GithubLogo, EnvelopeSimple } from "@phosphor-icons/react";

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
  { name: "Certibyt", what: "Multi-tenant SaaS exam and proctoring platform with tab-switch detection, webcam monitoring, real-time sessions and JWT auth. 186 automated tests across 7 Django apps.", stack: "Django, React (Vite)", link: "https://certibyt.com", label: "certibyt.com" },
  { name: "ConsultMe", what: "Real-time consultancy marketplace with WebSocket chat and escrow payments.", stack: "Real-time, Payments", link: "https://consultmee.in", label: "consultmee.in" },
  { name: "ClassPulse", what: "Smart attendance: students scan a QR code that rotates every 15 seconds, so screenshots cannot be shared for proxy attendance.", stack: "React, Django, MySQL", link: "https://github.com/Aman-0402/ClassPulse", label: "View on GitHub" },
  { name: "LearnHub", what: "This site: sell online and offline classes, with batches, timetables, payments and a student area.", stack: "React, Tailwind, Django, MySQL" },
  { name: "ARX Infotech website", what: "Corporate website rebuild with a React frontend and Django backend.", stack: "React, Django" },
];

const H = ({ id, children }) => <h2 id={id} className="mb-6 text-3xl font-semibold sm:text-4xl">{children}</h2>;

export default function Portfolio() {
  useTitle("About me", {
    description: "Aman Raj is a Full-Stack Developer and IT Trainer in Vadodara building React and Django products and teaching web development and AI.",
    type: "profile",
    jsonLd: { "@context": "https://schema.org", "@type": "Person", name: OWNER.name, jobTitle: "Full-Stack Developer and IT Trainer", address: { "@type": "PostalAddress", addressLocality: "Vadodara", addressRegion: "Gujarat", addressCountry: "IN" }, sameAs: [OWNER.github] },
  });
  return (
    <div className="grid gap-16 lg:grid-cols-[22rem_1fr] lg:gap-20">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Avatar name={OWNER.name} size="h-24 w-24" text="text-3xl" />
        <h1 className="mt-6 text-5xl font-semibold leading-none">{OWNER.name}</h1>
        <p className="mt-4 text-lg text-slate-700">Full-Stack Developer and IT Trainer in Vadodara, Gujarat. I build web products and teach people how to build them.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="#contact" className="btn btn-primary"><EnvelopeSimple size={18} aria-hidden="true" />Get in touch</a>
          <a href={OWNER.github} target="_blank" rel="noopener noreferrer" className="btn btn-quiet"><GithubLogo size={18} aria-hidden="true" />GitHub<span className="sr-only"> (opens in a new tab)</span></a>
        </div>
      </aside>

      <div className="min-w-0 space-y-20">
        <section aria-labelledby="about">
          <H id="about">About me</H>
          <p className="max-w-2xl text-lg text-slate-700">I am from Bokaro Steel City and now based in Vadodara. I hold a B.Tech in Computer Science and Engineering from Sambalpur University Institute of Information Technology (2024, CGPA 7.86). I have always mixed building and teaching, and I take on freelance and client web work for local businesses alongside my main role. These days I am putting more of my time into AI and generative AI.</p>
        </section>

        <section aria-labelledby="work">
          <H id="work">Where I work</H>
          <ul className="border-t border-slate-200">
            {ROLES.map(([role, org, when, d], i) => (
              <Reveal as="li" key={role} delay={i * 70} className="grid gap-2 border-b border-slate-200 py-6 sm:grid-cols-[1fr_2fr] sm:gap-8">
                <div><h3 className="text-xl font-semibold">{role}</h3><p className="mt-1 text-sm text-slate-600">{org}</p><p className="num mt-1 text-xs text-slate-600">{when}</p></div>
                <p className="text-slate-700">{d}</p>
              </Reveal>
            ))}
          </ul>
        </section>

        <section aria-labelledby="skills">
          <H id="skills">Skills and stack</H>
          <dl className="border-t border-slate-200">
            {SKILLS.map(([group, items]) => (
              <div key={group} className="grid gap-2 border-b border-slate-200 py-5 sm:grid-cols-[1fr_2fr] sm:gap-8">
                <dt className="font-semibold">{group}</dt>
                <dd className="num text-sm leading-7 text-slate-700">{items.join(", ")}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="projects">
          <H id="projects">Projects</H>
          <ul className="border-t border-slate-200">
            {PROJECTS.map((p, i) => (
              <Reveal as="li" key={p.name} delay={(i % 3) * 50} className="border-b border-slate-200 py-7">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-2xl font-semibold">{p.name}</h3>
                  <p className="num text-xs text-slate-600">{p.stack}</p>
                </div>
                <p className="mt-3 max-w-2xl text-slate-700">{p.what}</p>
                {p.link && <a href={p.link} target="_blank" rel="noopener noreferrer" className="link-draw mt-4 inline-flex items-center gap-1 font-semibold text-brand-strong">{p.label}<span className="sr-only"> (opens in a new tab)</span><ArrowUpRight size={16} aria-hidden="true" /></a>}
              </Reveal>
            ))}
          </ul>
        </section>

        <section id="contact" aria-labelledby="contact-h" className="border-t border-slate-900 pt-10">
          <h2 id="contact-h" className="max-w-lg text-4xl font-semibold sm:text-5xl">Need a website, a web app or a trainer?</h2>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={`mailto:${OWNER.email}`} className="btn btn-primary">Email me</a>
            <a href={OWNER.github} target="_blank" rel="noopener noreferrer" className="btn btn-quiet">GitHub<span className="sr-only"> (opens in a new tab)</span></a>
          </div>
        </section>
      </div>
    </div>
  );
}
