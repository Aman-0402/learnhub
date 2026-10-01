import { Link } from "react-router-dom";
import { SITE } from "../lib/site.js";

const col = "space-y-2 text-sm text-slate-600";
export default function Footer() {
  return (
    <footer className="print:hidden mt-8 border-t-4 border-brand-600 bg-brand-50">
      <div className="shell grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-2xl font-bold text-brand">{SITE.name}</p>
          <p className="mt-2 text-sm text-slate-600">Online and offline classes across every subject.</p>
        </div>
        <ul className={col}>
          <li className="font-semibold text-slate-900">Learn</li>
          <li><Link to="/courses" className="hover:text-slate-900">All courses</Link></li>
          <li><Link to="/instructors" className="hover:text-slate-900">Instructors</Link></li>
          <li><Link to="/saved" className="hover:text-slate-900">Saved courses</Link></li>
          <li><Link to="/faq" className="hover:text-slate-900">FAQ</Link></li>
        </ul>
        <ul className={col}>
          <li className="font-semibold text-slate-900">Company</li>
          <li><Link to="/about" className="hover:text-slate-900">About us</Link></li>
          <li><Link to="/portfolio" className="hover:text-slate-900">About the developer</Link></li>
          <li><Link to="/contact" className="hover:text-slate-900">Contact</Link></li>
        </ul>
        <ul className={col}>
          <li className="font-semibold text-slate-900">Reach us</li>
          <li>{SITE.email}</li>
          <li>{SITE.phone}</li>
          <li>{SITE.hours}</li>
        </ul>
      </div>
      <p className="border-t border-brand-100 py-4 text-center text-sm text-slate-600">© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
    </footer>
  );
}
