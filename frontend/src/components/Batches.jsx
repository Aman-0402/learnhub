import { DAY_ORDER } from "../lib/sample.js";

const fmtTime = (t) => new Date(`2000-01-01T${t}`).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
export const timeRange = (b) => `${fmtTime(b.start_time)} to ${fmtTime(b.end_time)}`;
export const dayList = (b) => DAY_ORDER.filter((d) => b.days.includes(d)).join(", ");

export function SampleNote({ children }) {
  return <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">{children}</p>;
}

export function BatchPicker({ batches, value, onChange }) {
  return (
    <fieldset className="mt-5">
      <legend className="mb-2 text-sm font-semibold">Choose your batch</legend>
      <div className="space-y-2">
        {batches.map((b) => {
          const full = b.seats_left === 0;
          return (
            <label key={b.id} className={`block cursor-pointer rounded-xl border p-3.5 text-sm transition-colors duration-150 has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand ${full ? "cursor-not-allowed opacity-60" : "border-slate-200"}`}>
              <input type="radio" name="batch" className="sr-only" disabled={full} checked={String(value) === String(b.id)} onChange={() => onChange(b.id)} />
              <span className="block font-medium">{b.label}</span>
              <span className="block text-slate-600">{dayList(b)}, {timeRange(b)}</span>
              <span className="block text-xs text-slate-500">{b.format}{b.seats_left != null && `, ${full ? "Full" : `${b.seats_left} seats left`}`}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** The next `n` class dates for a batch, starting today or the batch start date, whichever is later. */
export function nextClassDates(batch, n = 4) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const start = batch.start_date ? new Date(batch.start_date + "T00:00:00") : today;
  const d = new Date(Math.max(today, start));
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const out = [];
  for (let i = 0; i < 120 && out.length < n; i++, d.setDate(d.getDate() + 1)) {
    if (batch.days.includes(names[d.getDay()])) out.push(new Date(d));
  }
  return out;
}

export function Timetable({ batch }) {
  const upcoming = nextClassDates(batch);
  return (
    <div>
      <h2 className="font-semibold">{batch.label}</h2>
      <p className="text-sm text-slate-600">{timeRange(batch)}, {batch.format}</p>
      <ol aria-label="Weekly timetable" className="mt-4 grid grid-cols-7 gap-1.5 text-center text-xs">
        {DAY_ORDER.map((d) => {
          const on = batch.days.includes(d);
          return (
            <li key={d} className={`rounded-lg px-1 py-2 ${on ? "bg-brand-600 font-semibold text-[var(--color-on-accent)]" : "bg-slate-100 text-slate-600"}`}>
              {d}<span className="sr-only">{on ? ", class day" : ", no class"}</span>
            </li>
          );
        })}
      </ol>
      <h3 className="mb-2 mt-5 text-sm font-semibold">Upcoming classes</h3>
      <ul className="divide-y divide-slate-100 text-sm">
        {upcoming.map((d) => (
          <li key={d.toISOString()} className="flex justify-between py-2"><span>{d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}</span><span className="text-slate-600">{timeRange(batch)}</span></li>
        ))}
        {upcoming.length === 0 && <li className="py-2 text-slate-600">No upcoming classes found.</li>}
      </ul>
    </div>
  );
}
