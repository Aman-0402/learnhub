// Course thumbnails and instructor avatars. Real images are used when the API provides
// `image_url` / `photo_url`; otherwise a generated placeholder is drawn from the subject or name.
const HUES = [243, 199, 160, 32, 330, 12, 280, 190];
const hash = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

export function CourseThumb({ course, className = "h-32", label = false }) {
  if (course.image_url) {
    return <img src={course.image_url} alt={label ? course.title : ""} loading="lazy" className={`w-full object-cover ${className}`} />;
  }
  const hue = HUES[hash(course.subject.name) % HUES.length];
  return (
    <div aria-hidden="true" className={`relative flex w-full items-center justify-center overflow-hidden ${className}`}
      style={{ background: `linear-gradient(135deg, hsl(${hue} 70% 42%), hsl(${(hue + 40) % 360} 75% 58%))` }}>
      <span className="select-none text-6xl font-black text-white/25">{course.subject.name[0]}</span>
      <span className="absolute bottom-2 left-3 text-xs font-semibold uppercase tracking-wider text-white/80">{course.subject.name}</span>
    </div>
  );
}

export const initials = (n) => n.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

export function Avatar({ name, photo, size = "h-14 w-14", text = "text-lg" }) {
  if (photo) return <img src={photo} alt="" loading="lazy" className={`${size} shrink-0 rounded-full object-cover`} />;
  return <span aria-hidden="true" className={`flex ${size} ${text} shrink-0 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-strong`}>{initials(name)}</span>;
}
