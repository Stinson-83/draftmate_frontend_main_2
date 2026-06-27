"use client";

import { useEffect, useRef } from "react";

export default function ScrollReveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    /*
     * Set initial state via JS, not CSS class.
     * This prevents SSR from ever rendering opacity:0
     * (which would cause flash-of-invisible-content).
     */
    el.style.opacity   = "0";
    el.style.transform = "translateY(18px)";
    el.style.transition = `opacity 0.65s cubic-bezier(0.22,1,0.36,1) ${delay}ms,
                           transform 0.65s cubic-bezier(0.22,1,0.36,1) ${delay}ms`;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity   = "1";
          el.style.transform = "translateY(0)";
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}