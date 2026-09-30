import { Link } from "react-router-dom";
import { SITE } from "../lib/site.js";

const col = "space-y-2 text-sm text-slate-600";
export default function Footer() {
  return (
    <footer className="print:hidden border-t border-slate-200 bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-lg font-bold text-brand">{SITE.name}</p>
          <p className="mt-2 text-sm text-slate-600">Online and offline classes across every subject.</p>
        </div>
        <ul className={col}>
          <li className="font-semibold text-slate-900">Learn</li>
          <li><Link to="/courses" className="hover:text-slate-900">All courses</Link></li>
          <li><Link to="/instructors" className="hover:text-slate-900">Instructors</Link></li>
          <li><Link to="/faq" className="hover:text-slate-900">FAQ</Link></li>
        </ul>
        <ul className={col}>
          <li className="font-semibold text-slate-900">Company</li>
          <li><Link to="/about" className="hover:text-slate-900">About us</Link></li>
          <li><Link to="/contact" className="hover:text-slate-900">Contact</Link></li>
        </ul>
        <ul className={col}>
          <li className="font-semibold text-slate-900">Reach us</li>
          <li>{SITE.email}</li>
          <li>{SITE.phone}</li>
          <li>{SITE.hours}</li>
        </ul>
      </div>
      <p className="border-t border-slate-200 py-4 text-center text-sm text-slate-500">© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
    </footer>
  );
}
