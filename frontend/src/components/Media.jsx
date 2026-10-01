import { Code, Translate, MathOperations, Flask, MusicNotes, PaintBrush, Briefcase, BookOpen, Globe, ChartLineUp } from "@phosphor-icons/react";

// Course covers are typographic tiles until real images are uploaded (`image_url` on the course, `photo_url` on the instructor).
const ICONS = [
  [/program|code|web|software|computer|data/i, Code],
  [/english|language|hindi|french|spanish|speak/i, Translate],
  [/math|algebra|calcul|statistic/i, MathOperations],
  [/science|physics|chem|bio/i, Flask],
  [/music|guitar|piano|sing/i, MusicNotes],
  [/art|draw|design|paint/i, PaintBrush],
  [/business|account|commerce|finance|econom/i, ChartLineUp],
  [/career|interview|skill/i, Briefcase],
  [/geograph|social|history|world/i, Globe],
];
export const subjectIcon = (name) => (ICONS.find(([re]) => re.test(name)) || [null, BookOpen])[1];

export function CourseThumb({ course, className = "h-32", label = false, compact = false }) {
  if (course.image_url) {
    return <img src={course.image_url} alt={label ? course.title : ""} loading="lazy" className={`w-full object-cover ${className}`} />;
  }
  const Icon = subjectIcon(course.subject.name);
  if (compact) return <div aria-hidden="true" className={`flex w-full items-center justify-center bg-slate-100 ${className}`}><Icon size={32} weight="duotone" className="text-brand" /></div>;
  return (
    <div aria-hidden="true" className={`relative flex w-full items-end justify-between overflow-hidden bg-slate-100 p-4 ${className}`}>
      <Icon size={44} weight="duotone" className="text-brand" />
      <span className="max-w-[60%] text-right font-display text-sm font-semibold uppercase leading-tight tracking-wide text-slate-600">{course.subject.name}</span>
    </div>
  );
}

export const initials = (n) => n.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

export function Avatar({ name, photo, size = "h-14 w-14", text = "text-lg" }) {
  if (photo) return <img src={photo} alt="" loading="lazy" className={`${size} shrink-0 rounded-full object-cover`} />;
  return (
    <span aria-hidden="true" className={`flex ${size} ${text} shrink-0 items-center justify-center rounded-full bg-slate-900 font-display font-semibold text-slate-50`}>{initials(name)}</span>
  );
}
