import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import RequireAuth from "./components/RequireAuth.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
import Home from "./pages/Home.jsx";
import Courses from "./pages/Courses.jsx";
import CourseDetail from "./pages/CourseDetail.jsx";
import Instructors from "./pages/Instructors.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import Faq from "./pages/Faq.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Checkout from "./pages/Checkout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import MyCourses from "./pages/MyCourses.jsx";
import Learn from "./pages/Learn.jsx";
import Payments from "./pages/Payments.jsx";
import Profile from "./pages/Profile.jsx";

const guard = (el) => <RequireAuth>{el}</RequireAuth>;

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:slug" element={<CourseDetail />} />
          <Route path="/instructors" element={<Instructors />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/checkout/:slug" element={guard(<Checkout />)} />
          <Route path="/dashboard" element={guard(<Dashboard />)} />
          <Route path="/my-courses" element={guard(<MyCourses />)} />
          <Route path="/learn/:slug" element={guard(<Learn />)} />
          <Route path="/payments" element={guard(<Payments />)} />
          <Route path="/profile" element={guard(<Profile />)} />
          <Route path="*" element={<p className="text-slate-600">Page not found.</p>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
