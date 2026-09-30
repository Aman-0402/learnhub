// Sample data used while a FEATURES switch is off. Deterministic, so pages look the same on every visit.
const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function sampleBatches(course) {
  const left = (n) => (course.seats == null ? null : Math.max((course.seats_left ?? course.seats) - n, 0));
  const offline = course.mode !== "online";
  return [
    { id: "weekday-evening", label: "Weekday evenings", days: ["Mon", "Wed", "Fri"], start_time: "18:00", end_time: "19:30",
      start_date: course.start_date, format: course.mode === "hybrid" ? "Online, with in-person Fridays" : offline ? "In person" : "Online", seats_left: left(0) },
    { id: "weekend-morning", label: "Weekend mornings", days: ["Sat", "Sun"], start_time: "10:00", end_time: "12:00",
      start_date: course.start_date, format: offline ? "In person" : "Online", seats_left: left(2) },
  ];
}

export { DAY_ORDER };
