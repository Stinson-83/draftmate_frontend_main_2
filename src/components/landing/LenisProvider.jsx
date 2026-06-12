import { useEffect, useRef } from "react";
import Lenis from "@studio-freight/lenis";

export default function LenisProvider({ children }) {
  const lenisRef = useRef(null);
  const rafRef   = useRef(0);

  useEffect(() => {
    const lenis = new Lenis({
      /*
       * duration: removed — we use easing instead.
       * This prevents the "delay" feeling on trackpad.
       */
      lerp: 0.1,               // lower = more responsive, higher = more floaty
                               // 0.1 is the Linear/Framer sweet spot
      smoothWheel:  true,
      syncTouch:    false,     // let native touch handle mobile — no lag
      touchMultiplier: 1.0,    // natural touch feel
      wheelMultiplier: 1.0,    // 1:1 wheel ratio — no over-scroll
      infinite: false,
      easing: (t) =>           // custom ease-out-expo
        t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
    });

    lenisRef.current = lenis;

    /*
     * Use a single rAF loop — no GSAP ticker dependency.
     * This is the most performant pattern for Lenis.
     */
    let lastTime = 0;
    function raf(time) {
      // Only tick if enough time has passed (cap at 120fps)
      if (time - lastTime > 8) {
        lenis.raf(time);
        lastTime = time;
      }
      rafRef.current = requestAnimationFrame(raf);
    }
    rafRef.current = requestAnimationFrame(raf);

    /*
     * Anchor smooth-scroll — intercept hash links
     */
    const handleClick = (e) => {
      const a = e.target.closest("a[href^='#']");
      if (!a) return;
      const id = a.getAttribute("href")?.slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        lenis.scrollTo(target, { offset: -72, duration: 1.2 });
      }
    };
    document.addEventListener("click", handleClick);

    /*
     * Fix: when a modal/dialog opens, stop Lenis so it doesn't
     * fight with body overflow: hidden
     */
    const stopOnOverflow = new MutationObserver(() => {
      const overflowHidden = document.body.style.overflow === "hidden";
      if (overflowHidden) lenis.stop();
      else lenis.start();
    });
    stopOnOverflow.observe(document.body, {
      attributes: true,
      attributeFilter: ["style"],
    });

    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener("click", handleClick);
      stopOnOverflow.disconnect();
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}