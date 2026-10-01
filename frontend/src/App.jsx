import { lazy, Suspense } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import RequireAuth from "./components/RequireAuth.jsx";
import RequireStaff from "./components/RequireStaff.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
import Home from "./pages/Home.jsx";
const Courses = lazy(() => import("./pages/Courses.jsx"));
const CourseDetail = lazy(() => import("./pages/CourseDetail.jsx"));
const Instructors = lazy(() => import("./pages/Instructors.jsx"));
const InstructorDetail = lazy(() => import("./pages/InstructorDetail.jsx"));
const About = lazy(() => import("./pages/About.jsx"));
const Contact = lazy(() => import("./pages/Contact.jsx"));
const Faq = lazy(() => import("./pages/Faq.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.jsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.jsx"));
const Checkout = lazy(() => import("./pages/Checkout.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const MyCourses = lazy(() => import("./pages/MyCourses.jsx"));
const Learn = lazy(() => import("./pages/Learn.jsx"));
const Payments = lazy(() => import("./pages/Payments.jsx"));
const Receipt = lazy(() => import("./pages/Receipt.jsx"));
const Profile = lazy(() => import("./pages/Profile.jsx"));
const Portfolio = lazy(() => import("./pages/Portfolio.jsx"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout.jsx"));
const AdminHome = lazy(() => import("./pages/admin/AdminHome.jsx"));
const AdminCourses = lazy(() => import("./pages/admin/Courses.jsx"));
const AdminCourseForm = lazy(() => import("./pages/admin/CourseForm.jsx"));
const AdminSubjects = lazy(() => import("./pages/admin/Subjects.jsx"));
const AdminInstructors = lazy(() => import("./pages/admin/Instructors.jsx"));
const AdminEnrollments = lazy(() => import("./pages/admin/Enrollments.jsx"));
const AdminContactMessages = lazy(() => import("./pages/admin/ContactMessages.jsx"));
const AdminUsers = lazy(() => import("./pages/admin/Users.jsx"));
const Saved = lazy(() => import("./pages/Saved.jsx"));
const Compare = lazy(() => import("./pages/Compare.jsx"));
import { useTitle } from "./lib/hooks.js";

const guard = (el) => <RequireAuth>{el}</RequireAuth>;

function NotFound() {
  useTitle("Page not found", { noindex: true });
  return <div className="py-16"><h1 className="text-4xl font-semibold tracking-tight">Page not found</h1><p className="mt-3 text-slate-600">The page you are looking for does not exist.</p><Link to="/courses" className="btn btn-primary mt-6">Browse courses</Link></div>;
}

export default function App() {
  const { pathname } = useLocation();
  // Keep the admin shell (sidebar, layout) mounted across its own sub-routes: keying by
  // the full pathname would remount AdminLayout on every sidebar click, re-triggering its
  // lazy-load Suspense fallback and feeling like a full page reload.
  const pageKey = pathname.startsWith("/manage") ? "/manage" : pathname;
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <a href="#main" className="sr-only z-50 btn btn-primary focus:not-sr-only focus:absolute focus:left-4 focus:top-4">Skip to main content</a>
      <ScrollToTop />
      <Navbar />
      <main id="main" tabIndex={-1} className="shell flex-1 py-8">
        <div key={pageKey} className="page-in">
        <Suspense fallback={<div role="status" aria-busy="true" className="min-h-[60dvh]"><span className="sr-only">Loading</span></div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:slug" element={<CourseDetail />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/instructors" element={<Instructors />} />
          <Route path="/instructors/:slug" element={<InstructorDetail />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/checkout/:slug" element={guard(<Checkout />)} />
          <Route path="/dashboard" element={guard(<Dashboard />)} />
          <Route path="/my-courses" element={guard(<MyCourses />)} />
          <Route path="/learn/:slug" element={guard(<Learn />)} />
          <Route path="/payments" element={guard(<Payments />)} />
          <Route path="/receipts/:reference" element={guard(<Receipt />)} />
          <Route path="/profile" element={guard(<Profile />)} />
          <Route path="/manage" element={<RequireStaff><AdminLayout /></RequireStaff>}>
            <Route index element={<AdminHome />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="courses/new" element={<AdminCourseForm />} />
            <Route path="courses/:id" element={<AdminCourseForm />} />
            <Route path="subjects" element={<AdminSubjects />} />
            <Route path="instructors" element={<AdminInstructors />} />
            <Route path="enrollments" element={<AdminEnrollments />} />
            <Route path="contact" element={<AdminContactMessages />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}
