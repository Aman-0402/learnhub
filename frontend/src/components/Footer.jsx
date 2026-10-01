import { Link } from "react-router-dom";
import { SITE } from "../lib/site.js";

const col = "space-y-2.5 text-sm text-slate-600";
const a = "link-draw hover-fine:text-slate-900";
export default function Footer() {
  return (
    <footer className="print:hidden mt-16 border-t border-slate-200">
      <div className="shell grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <p className="font-display text-2xl font-bold tracking-tight">{SITE.name}</p>
          <p className="mt-3 max-w-xs text-sm text-slate-600">Live classes, online and in person. Pick a batch and pay the fee in one visit.</p>
        </div>
        <ul className={col}>
          <li className="font-semibold text-slate-900">Learn</li>
          <li><Link to="/courses" className={a}>All courses</Link></li>
          <li><Link to="/instructors" className={a}>Instructors</Link></li>
          <li><Link to="/saved" className={a}>Saved courses</Link></li>
          <li><Link to="/faq" className={a}>FAQ</Link></li>
        </ul>
        <ul className={col}>
          <li className="font-semibold text-slate-900">Company</li>
          <li><Link to="/about" className={a}>About us</Link></li>
          <li><Link to="/portfolio" className={a}>About the developer</Link></li>
          <li><Link to="/contact" className={a}>Contact</Link></li>
        </ul>
        <ul className={col}>
          <li className="font-semibold text-slate-900">Reach us</li>
          <li>{SITE.email}</li>
          <li>{SITE.phone}</li>
          <li>{SITE.hours}</li>
        </ul>
      </div>
      <p className="shell border-t border-slate-200 py-5 text-sm text-slate-600">© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
    </footer>
  );
}
