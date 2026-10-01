// Calendar (.ics) export for a course timetable and its live sessions. Works with Google, Apple and Outlook calendars.
const DAY_CODE = { Mon: "MO", Tue: "TU", Wed: "WE", Thu: "TH", Fri: "FR", Sat: "SA", Sun: "SU" };
const JS_DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const pad = (n) => String(n).padStart(2, "0");
const esc = (t = "") => String(t).replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const local = (d, hhmm) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${hhmm.replace(":", "")}00`;
const utc = (iso) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** First date on or after `from` that falls on one of the batch's class days. */
export function firstClassDate(batch, from) {
  const d = new Date(from); d.setHours(0, 0, 0, 0);
  for (let i = 0; i < 14; i++, d.setDate(d.getDate() + 1)) if (batch.days.includes(JS_DAY[d.getDay()])) return new Date(d);
  return null;
}

export function buildICS({ course, batch, sessions = [] }) {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//LearnHub//Timetable//EN", "CALSCALE:GREGORIAN", `X-WR-CALNAME:${esc(course.title)}`];
  const stamp = utc(new Date().toISOString());
  const where = [batch?.format, course.location].filter(Boolean).join(" · ");
  if (batch) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const start = batch.start_date ? new Date(batch.start_date + "T00:00:00") : today;
    const first = firstClassDate(batch, new Date(Math.max(today, start)));
    if (first) {
      const until = new Date(first); until.setDate(until.getDate() + course.duration_weeks * 7);
      lines.push("BEGIN:VEVENT", `UID:${course.slug}-${batch.id}@learnhub`, `DTSTAMP:${stamp}`,
        `DTSTART:${local(first, batch.start_time)}`, `DTEND:${local(first, batch.end_time)}`,
        `RRULE:FREQ=WEEKLY;BYDAY=${batch.days.map((d) => DAY_CODE[d]).join(",")};UNTIL=${local(until, "235959")}`,
        `SUMMARY:${esc(course.title)} (${esc(batch.label)})`, `LOCATION:${esc(where)}`,
        `DESCRIPTION:${esc(`${course.title}, ${batch.label}. Instructor: ${course.instructor || "to be announced"}.`)}`, "END:VEVENT");
    }
  }
  for (const l of sessions) {
    const end = new Date(new Date(l.session_at).getTime() + (l.duration_minutes || 60) * 60000).toISOString();
    lines.push("BEGIN:VEVENT", `UID:${course.slug}-lesson-${l.id}@learnhub`, `DTSTAMP:${stamp}`, `DTSTART:${utc(l.session_at)}`, `DTEND:${utc(end)}`,
      `SUMMARY:${esc(`${course.title}: ${l.title}`)}`, `LOCATION:${esc(where)}`, "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

export function downloadICS(filename, text) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/calendar;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
