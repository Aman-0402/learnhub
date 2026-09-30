import { Link } from "react-router-dom";
import { useTitle } from "../lib/hooks.js";
import PageHeader from "../components/PageHeader.jsx";

const FAQS = [
  ["How do I enroll in a course?", "Create an account, open the course you want and choose Enroll now. After you pay the fee, the course appears in your dashboard."],
  ["What is the difference between online, offline and hybrid?", "Online courses are attended from home. Offline courses meet in person at our centre. Hybrid courses combine both."],
  ["How do I pay the fees?", "You pay the full course fee at checkout. Online payment options will be shown there once payments are switched on."],
  ["Can I enroll in more than one course?", "Yes. You can enroll in as many courses as you like, but you cannot enroll in the same course twice."],
  ["What happens if a course is full?", "Courses with limited seats show how many are left. When none remain, enrollment closes for that course."],
  ["Where can I see my receipts?", "Open Payments in your account to see every course you have paid for, with the amount, date and reference."],
  ["How do I change my name or phone number?", "Go to Profile in your account and update your details. Your email address cannot be changed."],
];

export default function Faq() {
  useTitle("FAQ");
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Frequently asked questions" />
      <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-surface">
        {FAQS.map(([q, a]) => (
          <details key={q} className="group px-6 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
              {q}
              <span className="text-slate-400 transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm text-slate-600">{a}</p>
          </details>
        ))}
      </div>
      <p className="mt-6 text-center text-sm text-slate-600">
        Still have a question? <Link to="/contact" className="font-medium text-brand">Contact us</Link>
      </p>
    </div>
  );
}
