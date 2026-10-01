import { Link } from "react-router-dom";
import { Plus } from "@phosphor-icons/react";
import { useTitle } from "../lib/hooks.js";

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
  useTitle("FAQ", {
    description: "Answers to common questions about enrolling, paying, batches, online and offline classes at LearnHub.",
    jsonLd: { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQS.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
  });
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
      <div>
        <h1 className="text-4xl font-semibold sm:text-6xl">Questions, answered.</h1>
        <p className="mt-5 text-slate-600">Still unsure? <Link to="/contact" className="link-draw font-semibold text-brand-strong">Contact us</Link>.</p>
      </div>
      <div className="border-t border-slate-200">
        {FAQS.map(([q, a]) => (
          <details key={q} className="group border-b border-slate-200">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-medium">
              {q}
              <Plus size={20} aria-hidden="true" className="shrink-0 text-slate-500 transition-transform duration-300 [transition-timing-function:var(--ease-out-strong)] group-open:rotate-45" />
            </summary>
            <p className="max-w-xl pb-5 text-slate-600">{a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
