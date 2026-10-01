import { SUBJECT_COLORS } from "../lib/colors.js";

// Course thumbnails and instructor avatars. Real images are used when the API provides
// `image_url` / `photo_url`; otherwise colourful generated art is drawn from the subject or name.
const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

const PATTERNS = [
  (c) => <><circle cx="82%" cy="25%" r="46" fill={c} opacity=".22" /><circle cx="14%" cy="85%" r="30" fill={c} opacity=".18" /><circle cx="62%" cy="95%" r="18" fill={c} opacity=".25" /></>,
  (c) => <><path d="M-10 70 Q 40 30 90 70 T 190 70 T 290 70" stroke={c} strokeWidth="9" fill="none" opacity=".25" strokeLinecap="round" /><path d="M-10 110 Q 40 70 90 110 T 190 110 T 290 110" stroke={c} strokeWidth="9" fill="none" opacity=".18" strokeLinecap="round" /></>,
  (c) => <><polygon points="260,10 310,100 210,100" fill={c} opacity=".22" /><polygon points="20,120 60,60 100,120" fill={c} opacity=".2" /><rect x="150" y="14" width="26" height="26" rx="6" fill={c} opacity=".25" transform="rotate(20 163 27)" /></>,
  (c) => <>{Array.from({ length: 24 }, (_, i) => <circle key={i} cx={20 + (i % 8) * 36} cy={24 + Math.floor(i / 8) * 36} r="4" fill={c} opacity=".3" />)}</>,
  (c) => <><circle cx="80%" cy="30%" r="40" fill="none" stroke={c} strokeWidth="10" opacity=".25" /><circle cx="18%" cy="78%" r="26" fill="none" stroke={c} strokeWidth="8" opacity=".22" /></>,
  (c) => <><rect x="-20" y="80" width="120" height="30" rx="15" fill={c} opacity=".2" transform="rotate(-18 40 95)" /><rect x="170" y="20" width="140" height="30" rx="15" fill={c} opacity=".22" transform="rotate(-18 240 35)" /></>,
];

export const artIndex = (name) => hash(name) % SUBJECT_COLORS.length;

export function CourseThumb({ course, className = "h-32", label = false }) {
  if (course.image_url) {
    return <img src={course.image_url} alt={label ? course.title : ""} loading="lazy" className={`w-full object-cover ${className}`} />;
  }
  const i = artIndex(course.subject.name);
  const [from, to] = SUBJECT_COLORS[i];
  return (
    <div aria-hidden="true" className={`relative w-full overflow-hidden ${className}`} style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 300 130" preserveAspectRatio="xMidYMid slice">{PATTERNS[i % PATTERNS.length]("#fff")}</svg>
      <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-[#1e1b4b]">{course.subject.name}</span>
    </div>
  );
}

export const initials = (n) => n.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

export function Avatar({ name, photo, size = "h-14 w-14", text = "text-lg" }) {
  if (photo) return <img src={photo} alt="" loading="lazy" className={`${size} shrink-0 rounded-full object-cover`} />;
  const [from, to] = SUBJECT_COLORS[artIndex(name)];
  return (
    <span aria-hidden="true" className={`flex ${size} ${text} shrink-0 items-center justify-center rounded-full font-display font-semibold text-white ring-4 ring-white/60 dark:ring-white/10`}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>{initials(name)}</span>
  );
}
