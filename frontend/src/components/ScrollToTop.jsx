import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();
  const first = useRef(true);
  useEffect(() => {
    window.scrollTo(0, 0);
    if (first.current) { first.current = false; return; }
    document.getElementById("main")?.focus({ preventScroll: true }); // announces the new page to screen readers
  }, [pathname]);
  return null;
}
