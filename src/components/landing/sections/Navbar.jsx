import { useState, useEffect } from "react";
import { Menu, X, Zap, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";

// ── Navigation links ─────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: "Law Jurist",   href: "#lawjurist" },
  { label: "Features",     href: "#features"  },
  { label: "Blogs",        href: "#blogs"     },
  { label: "About",        href: "#about"     },
  { label: "Pricing",      href: "#pricing"   },
  { label: "FAQs",         href: "#faq"       },
  { label: "How it Works", href: "#steps"     },
];

const ACADEMY_STYLE = {
  background: "linear-gradient(135deg, rgba(37,99,235,0.10), rgba(14,165,233,0.10))",
  border:     "1px solid rgba(37,99,235,0.22)",
  color:      "#2563EB",
};

const ACADEMY_MOBILE_STYLE = {
  background: "linear-gradient(135deg, rgba(37,99,235,0.07), rgba(14,165,233,0.07))",
  border:     "1px solid rgba(37,99,235,0.15)",
  color:      "#2563EB",
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen]         = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-xl border-b border-slate-200/70 shadow-sm shadow-slate-200/50"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-5 md:px-10">

        {/* ══════════════════════════════════════════════════════════
            Desktop — TRUE 3-COLUMN GRID
            Col 1 (fixed 220px) : Logo
            Col 2 (1fr)         : Nav links — justify-center
            Col 3 (auto)        : CTA buttons
        ══════════════════════════════════════════════════════════ */}
        <div
          className="hidden lg:grid items-center h-[70px]"
          style={{ gridTemplateColumns: "220px 1fr auto", columnGap: "1rem" }}
        >

          {/* ── ① Logo ─────────────────────────────────────────── */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div
              className="relative w-9 h-9 rounded-xl flex items-center justify-center
                         overflow-hidden transition-transform duration-300 group-hover:scale-105"
              style={{ background: "linear-gradient(135deg,rgba(37,99,235,0.07),rgba(14,165,233,0.07))" }}
            >
              <img
                src="/logo.png"
                alt="DraftMate"
                className="w-7 h-7 object-contain relative z-10"
              />
              {/* Live pulse dot */}
              <span
                className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-cyan-400"
                style={{ animation: "pulseRing 2.5s ease-out infinite" }}
              />
            </div>

            <div className="relative h-10 w-[170px]">
              <img
                src="/text-removebg-preview.png"
                alt="DraftMate"
                className="w-full h-full object-contain object-left mix-blend-multiply"
              />
            </div>
          </Link>

          {/* ── ② Nav links — centered in remaining space ───────── */}
          <div className="flex items-center justify-center gap-0 px-2">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.label}
                to={l.href}
                className="px-2.5 py-2 text-[12.5px] font-medium text-slate-500
                           hover:text-slate-900 rounded-lg hover:bg-slate-50/80
                           transition-all duration-200 whitespace-nowrap"
              >
                {l.label}
              </Link>
            ))}

            {/* Academy pill */}
            <Link
              to="#academy"
              style={ACADEMY_STYLE}
              className="ml-1.5 flex items-center gap-1.5 px-3 py-1.5 rounded-full
                         text-[12px] font-semibold whitespace-nowrap
                         transition-all duration-200 hover:opacity-90 hover:scale-[1.03]"
            >
              <GraduationCap className="w-3.5 h-3.5 shrink-0" />
              LJ Academy
            </Link>
          </div>

          {/* ── ③ CTA buttons ────────────────────────────────────── */}
          <div className="flex items-center gap-2">
            <button
              className="h-[38px] px-4 text-[13px] font-medium rounded-xl
                         border border-slate-200 bg-white text-slate-700
                         hover:bg-slate-50 hover:border-slate-300
                         transition-all duration-200 whitespace-nowrap"
            >
              Login
            </button>

            <button
              className="h-[38px] px-4 text-[13px] font-semibold rounded-xl
                         flex items-center gap-1.5 text-white whitespace-nowrap
                         transition-all duration-200 hover:opacity-90 hover:scale-[1.02]"
              style={{
                background:  "linear-gradient(135deg, #2563EB 0%, #0EA5E9 100%)",
                boxShadow:   "0 2px 14px rgba(37,99,235,0.32)",
              }}
            >
              <Zap className="w-3.5 h-3.5" />
              Start Drafting
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            Mobile header
        ══════════════════════════════════════════════════════════ */}
        <div className="flex lg:hidden items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div
              className="relative w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden"
              style={{ background: "rgba(37,99,235,0.06)" }}
            >
              <img src="/logo.png" alt="DraftMate" className="w-6 h-6 object-contain z-10" />
            </div>
            <div className="relative h-9 w-[140px]">
              <img
                src="/text-removebg-preview.png"
                alt="DraftMate"
                className="w-full h-full object-contain object-left mix-blend-multiply"
              />
            </div>
          </Link>

          <button
            onClick={() => setOpen(!open)}
            className="p-2 rounded-lg border border-slate-200 bg-white/80 backdrop-blur-sm"
          >
            {open
              ? <X    className="w-4 h-4 text-slate-700" />
              : <Menu className="w-4 h-4 text-slate-700" />
            }
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          Mobile drawer (slide-down)
      ══════════════════════════════════════════════════════════ */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out
                    ${open ? "max-h-[640px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="bg-white/98 backdrop-blur-xl border-t border-slate-100 px-5 py-4 space-y-1">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.label}
              to={l.href}
              className="block px-4 py-3 text-slate-600 hover:text-slate-900
                         hover:bg-slate-50 rounded-xl transition-all text-sm font-medium"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}

          {/* Academy in drawer */}
          <Link
            to="#academy"
            style={ACADEMY_MOBILE_STYLE}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
            onClick={() => setOpen(false)}
          >
            <GraduationCap className="w-4 h-4" />
            Law Jurist Academy
          </Link>

          {/* Mobile CTA row */}
          <div className="grid grid-cols-2 gap-2 pt-3">
            <button
              className="py-3 text-sm font-medium rounded-xl
                         border border-slate-200 bg-white text-slate-700
                         hover:bg-slate-50 transition-all"
            >
              Login
            </button>
            <button
              className="py-3 text-sm font-semibold rounded-xl text-white
                         transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #2563EB, #0EA5E9)" }}
            >
              Start Drafting
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}