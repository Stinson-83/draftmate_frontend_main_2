"use client";

import { useEffect, useRef, useState } from "react";

export default function AnimatedCounter({
  to, suffix = "", prefix = "", duration = 2000, className = "",
}) {
  const [val, setVal]   = useState(0);
  const [run, setRun]   = useState(false);
  const ref             = useRef(null);

  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setRun(true); io.disconnect(); } },
      { threshold: 0.4 },
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!run) return;
    let start;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(Math.floor((1 - Math.pow(1 - p, 3)) * to));
      if (p < 1) requestAnimationFrame(step);
      else setVal(to);
    };
    requestAnimationFrame(step);
  }, [run, to, duration]);

  return <span ref={ref} className={className}>{prefix}{val}{suffix}</span>;
}