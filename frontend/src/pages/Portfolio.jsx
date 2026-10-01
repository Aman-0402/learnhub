import { useTitle } from "../lib/hooks.js";
import { OWNER } from "../lib/site.js";
import { Avatar } from "../components/Media.jsx";
import { motion } from "motion/react";
import { ArrowUpRight, GithubLogo, EnvelopeSimple, LinkedinLogo, Code, Users, Certificate, ShieldCheck, TestTube, ClockCountdown, MapPin } from "@phosphor-icons/react";
import { EASE, Reveal } from "../components/Fun.jsx";

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

const ROLES = [
  ["AI Trainer", "CodedevH · Allenhouse Institute of Technology & Business School", "Aug 2026 to now", "Delivering applied AI training and developing AI models, translating model-building workflows into structured learning material."],
  ["Sr. IT Trainer", "Ethnotech Academic Solutions · Parul University", "Jul 2025 to Jun 2026", "Designed and delivered training across HTML/CSS, JavaScript, Python, Django, Flask, Statistics, AWS and Networking for 2000+ students. Built a Generative AI curriculum module and mentored capstone projects."],
  ["Technical Trainer", "Anuratech Solutions · Parul University", "Apr 2025 to Jun 2025", "Led design, deployment and maintenance of enterprise IT infrastructure supporting academic and training platforms."],
  ["Machine Learning Trainer", "Databits Technologia", "Aug 2024 to Mar 2025", "Developed and deployed ML models for predictive analytics; built automated training pipelines with Python, TensorFlow and scikit-learn."],
  ["Technical Trainer, Python Full Stack", "Malla Reddy College, Hyderabad", "May 2024 to Jul 2024", "Delivered structured Python Full Stack training covering core Python, HTML/CSS, JavaScript and frontend/backend integration."],
  ["Full Stack Intern", "ARX Infotech", "Aug 2023 to Feb 2024", "Built full-stack web apps with Python, Django and DRF; responsive frontends integrated with REST APIs; collaborated on MySQL database design and deployment."],
];

const SKILLS = [
  ["Frontend", ["React", "Next.js", "TypeScript", "JavaScript", "Tailwind CSS", "Bootstrap", "Redux Toolkit", "Zustand"]],
  ["Backend", ["Django", "Django REST Framework", "Django Channels", "Node.js", "Express.js", "Flask"]],
  ["Database", ["MySQL", "PostgreSQL", "MongoDB", "Prisma", "Redis"]],
  ["AI / Generative AI", ["Machine Learning", "Deep Learning", "Prompt Engineering", "Context Engineering", "LLM Integration (Claude API, NVIDIA NIM)", "Agentic AI (Claude Code)"]],
  ["Data Science", ["NumPy", "Pandas", "Matplotlib", "Scikit-learn"]],
  ["Cloud & Tools", ["Git", "GitHub", "AWS", "VS Code", "Postman", "Jupyter Notebook"]],
];

const PROJECTS = [
  { name: "Certibyt", what: "Multi-tenant SaaS exam and certification platform with Super Admin, Org Admin and Candidate portals and full tenant isolation. Proctored exam engine with tab-switch detection, webcam monitoring and question shuffling. Voucher commerce, PDF certificates and public verification. 186 automated tests across 7 apps.", stack: "Django, React, Redux Toolkit, MariaDB, ReportLab, JWT", link: "https://certibyt.com", label: "certibyt.com" },
  { name: "ConsultME", what: "Multi-role consultancy marketplace (Client, Freelancer, Consultant, Admin) with real-time WebSocket chat and an escrow payment system (platform fee, GST, convenience fee) that locks funds on booking and releases on completion.", stack: "Django, DRF, React, Redis, Celery, Django Channels", link: "https://consultmee.in", label: "consultmee.in" },
  { name: "ClassPulse", what: "Real-time attendance system: students scan a QR code that auto-rotates every 15 seconds so screenshots go stale instantly. Server-side scan validation, suspicious-activity detection and a live teacher dashboard pushed over WebSocket.", stack: "React, Bootstrap 5, Django, Django Channels, MySQL", link: "https://github.com/Aman-0402/ClassPulse", label: "View on GitHub" },
  { name: "UrbanEase", what: "Hyperlocal service marketplace with geolocation-based provider discovery (Haversine proximity sorting), a full booking lifecycle with audit-log timeline, and role-specific dashboards for Customer, Provider and Admin.", stack: "Django, DRF, React, MySQL, JWT, Zustand", link: "https://github.com/Aman-0402/UrbanEase", label: "View on GitHub" },
  { name: "LearnHub", what: "This site: sell online and offline classes, with batches, timetables, payments and a student area.", stack: "React, Tailwind, Django, MySQL" },
];

const EDUCATION = [
  ["B.Tech, Computer Science & Engineering", "Sambalpur University Institute of Information Technology, Odisha"],
  ["Class XII, CBSE", "Guru Gobind Singh Public School, Bokaro Steel City"],
  ["Class X, CBSE", "Guru Gobind Singh Public School, Bokaro Steel City"],
];

const CERTIFICATIONS = [
  "AWS Certified Data Engineer — Amazon Web Services",
  "Python for Data Science — IBM",
  "Statistics for Data Science — IBM",
  "HTML, CSS & JavaScript — Pearson",
  "Machine Learning with Python A-Z — Udemy",
  "AI Essentials: Introduction to Artificial Intelligence — Udemy",
  "AWS Essentials: A Complete Beginner's Guide — Udemy",
  "JavaScript Programming: From Novice to Expert — Udemy",
  "Information Security Fundamentals — Udemy",
  "Oracle Agentic AI Certified",
];

const ACHIEVEMENTS = [
  [Users, "2000+", "Students trained across leading universities"],
  [ClockCountdown, "3+ years", "Combined industry and training experience"],
  [Certificate, "10", "Certifications earned, including AWS and Oracle"],
  [ShieldCheck, "4", "Production platforms shipped end to end"],
  [TestTube, "186", "Automated tests written for Certibyt alone"],
];

const H = ({ id, children }) => <h2 id={id} className="mb-6 text-3xl font-semibold sm:text-4xl">{children}</h2>;

export default function Portfolio() {
  useTitle("About me", {
    description: "Aman Raj is an AI & Full-Stack Trainer and Full-Stack Developer in Vadodara, with 2000+ students trained and real-world products built across Django, React and Generative AI.",
    type: "profile",
    jsonLd: { "@context": "https://schema.org", "@type": "Person", name: OWNER.name, jobTitle: "AI & Full-Stack Trainer · Full-Stack Developer", address: { "@type": "PostalAddress", addressLocality: "Vadodara", addressRegion: "Gujarat", addressCountry: "IN" }, sameAs: [OWNER.github, OWNER.linkedin, OWNER.leetcode].filter(Boolean) },
  });
  return (
    <div className="grid gap-16 lg:grid-cols-[22rem_1fr] lg:gap-20">
      <motion.aside initial="hidden" animate="show" variants={stagger} className="lg:sticky lg:top-24 lg:self-start">
        <motion.div variants={fadeUp} className="inline-block overflow-hidden rounded-full border-2 border-brand-500/50 p-1">
          <Avatar name={OWNER.name} photo="/image.jpeg" size="h-40 w-40" text="text-3xl" />
        </motion.div>
        <motion.p variants={fadeUp} className="tag mt-6"><MapPin size={14} aria-hidden="true" />{OWNER.location || "Vadodara, Gujarat"}</motion.p>
        <motion.h1 variants={fadeUp} className="mt-3 text-5xl font-semibold leading-none">{OWNER.name}</motion.h1>
        <motion.p variants={fadeUp} className="mt-4 text-lg text-slate-700">AI & Full-Stack Trainer and Full-Stack Developer in Vadodara, Gujarat. 2000+ students trained across leading universities; real-world products shipped in Django, React and Generative AI.</motion.p>
        <motion.div variants={fadeUp} className="mt-6 flex flex-wrap gap-3">
          <a href="#contact" className="btn btn-primary"><EnvelopeSimple size={18} aria-hidden="true" />Get in touch</a>
          <a href={OWNER.github} target="_blank" rel="noopener noreferrer" className="btn btn-quiet"><GithubLogo size={18} aria-hidden="true" />GitHub<span className="sr-only"> (opens in a new tab)</span></a>
          {OWNER.linkedin && <a href={OWNER.linkedin} target="_blank" rel="noopener noreferrer" className="btn btn-quiet"><LinkedinLogo size={18} aria-hidden="true" />LinkedIn<span className="sr-only"> (opens in a new tab)</span></a>}
          {OWNER.leetcode && <a href={OWNER.leetcode} target="_blank" rel="noopener noreferrer" className="btn btn-quiet"><Code size={18} aria-hidden="true" />LeetCode<span className="sr-only"> (opens in a new tab)</span></a>}
        </motion.div>
      </motion.aside>

      <div className="min-w-0 space-y-20">
        <section aria-labelledby="about">
          <H id="about">About me</H>
          <p className="max-w-2xl text-lg text-slate-700">I am from Bokaro Steel City and now based in Vadodara. I hold a B.Tech in Computer Science and Engineering from Sambalpur University Institute of Information Technology. Over 3 years of combined industry and training experience: designing full-stack, AI/ML and cloud curricula for 2000+ students at leading universities, backed by real-world development across MERN, Django and Generative AI systems.</p>
        </section>

        <section aria-labelledby="achievements">
          <H id="achievements">Achievements</H>
          <ul className="border-t border-slate-200">
            {ACHIEVEMENTS.map(([Icon, stat, label], i) => (
              <Reveal as="li" key={label} delay={i * 60} className="flex items-center gap-5 border-b border-slate-200 py-5">
                <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-300 text-brand-strong">
                  <Icon size={22} weight="duotone" />
                </span>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="num text-2xl font-semibold">{stat}</span>
                  <span className="text-slate-700">{label}</span>
                </div>
              </Reveal>
            ))}
          </ul>
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

        <section aria-labelledby="education">
          <H id="education">Education</H>
          <ul className="border-t border-slate-200">
            {EDUCATION.map(([degree, school], i) => (
              <Reveal as="li" key={degree} delay={i * 70} className="grid gap-2 border-b border-slate-200 py-6 sm:grid-cols-[1fr_2fr] sm:gap-8">
                <h3 className="text-xl font-semibold">{degree}</h3>
                <p className="text-slate-700">{school}</p>
              </Reveal>
            ))}
          </ul>
        </section>

        <section aria-labelledby="certifications">
          <H id="certifications">Certifications and training</H>
          <dl className="border-t border-slate-200 py-5">
            <dd className="text-sm leading-7 text-slate-700">{CERTIFICATIONS.join(" · ")}</dd>
          </dl>
        </section>

        <section id="contact" aria-labelledby="contact-h" className="border-t border-slate-900 pt-10">
          <h2 id="contact-h" className="max-w-lg text-4xl font-semibold sm:text-5xl">Need a website, a web app or a trainer?</h2>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={`mailto:${OWNER.email}`} className="btn btn-primary">Email me</a>
            <a href={OWNER.github} target="_blank" rel="noopener noreferrer" className="btn btn-quiet">GitHub<span className="sr-only"> (opens in a new tab)</span></a>
            {OWNER.linkedin && <a href={OWNER.linkedin} target="_blank" rel="noopener noreferrer" className="btn btn-quiet">LinkedIn<span className="sr-only"> (opens in a new tab)</span></a>}
          </div>
        </section>
      </div>
    </div>
  );
}
