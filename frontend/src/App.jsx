import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import RequireAuth from "./components/RequireAuth.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
import Home from "./pages/Home.jsx";
import Courses from "./pages/Courses.jsx";
import CourseDetail from "./pages/CourseDetail.jsx";
import Instructors from "./pages/Instructors.jsx";
import InstructorDetail from "./pages/InstructorDetail.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import Faq from "./pages/Faq.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import Checkout from "./pages/Checkout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import MyCourses from "./pages/MyCourses.jsx";
import Learn from "./pages/Learn.jsx";
import Payments from "./pages/Payments.jsx";
import Receipt from "./pages/Receipt.jsx";
import Profile from "./pages/Profile.jsx";
import { useTitle } from "./lib/hooks.js";

const guard = (el) => <RequireAuth>{el}</RequireAuth>;

function NotFound() {
  useTitle("Page not found");
  return <div className="text-center"><h1 className="text-2xl font-bold">Page not found</h1><p className="mt-2 text-slate-600">The page you are looking for does not exist.</p></div>;
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only z-50 rounded-lg bg-brand-600 px-4 py-2 text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4">Skip to main content</a>
      <ScrollToTop />
      <Navbar />
      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 outline-none">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:slug" element={<CourseDetail />} />
          <Route path="/instructors" element={<Instructors />} />
          <Route path="/instructors/:slug" element={<InstructorDetail />} />
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
