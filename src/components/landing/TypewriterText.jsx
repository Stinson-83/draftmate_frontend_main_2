"use client";

import { useState, useEffect, useCallback } from "react";

export default function TypewriterText({
  texts,
  typingSpeed   = 55,
  deletingSpeed = 28,
  pauseMs       = 2600,
  className     = "",
  cursorClass   = "",
}) {
  const [displayed, setDisplayed] = useState("");
  const [phase, setPhase]         = useState("typing");
  const [idx, setIdx]             = useState(0);

  const tick = useCallback(() => {
    const full = texts[idx];
    if (phase === "typing") {
      if (displayed.length < full.length) {
        setDisplayed(full.slice(0, displayed.length + 1));
      } else {
        setPhase("pausing");
      }
    } else if (phase === "deleting") {
      if (displayed.length > 0) {
        setDisplayed((d) => d.slice(0, -1));
      } else {
        setIdx((i) => (i + 1) % texts.length);
        setPhase("typing");
      }
    }
  }, [displayed, phase, idx, texts]);

  /* Typing / deleting intervals */
  useEffect(() => {
    if (phase === "pausing") {
      const t = setTimeout(() => setPhase("deleting"), pauseMs);
      return () => clearTimeout(t);
    }
    const speed = phase === "typing" ? typingSpeed : deletingSpeed;
    const t = setTimeout(tick, speed);
    return () => clearTimeout(t);
  }, [tick, phase, pauseMs, typingSpeed, deletingSpeed]);

  return (
    <span className={className}>
      {displayed}
      <span
        className={`inline-block w-[2px] h-[1em] align-middle ml-[2px] ${cursorClass}`}
        style={{
          background: "linear-gradient(135deg,#60A5FA,#3B82F6)",
          animation:  "pulse 1s ease-in-out infinite",
        }}
      />
    </span>
  );
}