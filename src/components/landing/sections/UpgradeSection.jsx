import { ArrowRight, Check, Zap } from "lucide-react";
import TypewriterText from "@/components/landing/TypewriterText";
import ScrollReveal from "@/components/landing/ScrollReveal";

const BENEFITS = [
  "Draft any Indian legal document in under 2 minutes",
  "Verified citations from Supreme Court & High Courts",
  "Zero hallucinations — guaranteed accuracy",
  "Auto-updated with BNS, DPDPA and latest laws",
  "Lex Bot research assistant included",
  "Full data privacy — attorney-client privilege level",
];

const TYPED = [
  "Start drafting in minutes, not hours.",
  "Let AI handle the research.",
  "File with confidence every time.",
  "Join 5000+ Indian advocates.",
];

export default function UpgradeSection() {
  return (
    <section className="section-pad divider">
      <div className="container-xl">
        <ScrollReveal>
          <div
            className="max-w-4xl mx-auto rounded-3xl p-10 md:p-16 text-center relative overflow-hidden"
            style={{
              background: "linear-gradient(160deg, #0F1C2E 0%, #1E3A5F 100%)",
              boxShadow: "0 24px 64px rgba(15,28,46,0.2), 0 4px 16px rgba(15,28,46,0.1)",
            }}
          >
            {/* Subtle grid overlay */}
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />
            {/* Top glow */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] pointer-events-none"
              style={{
                background: "radial-gradient(ellipse, rgba(37,99,235,0.3) 0%, transparent 70%)",
              }}
            />

            <div className="relative z-10">
              <span className="text-[11px] tracking-[0.25em] uppercase font-semibold block mb-4"
                style={{ color: "#60A5FA" }}>
                Ready to Upgrade?
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
                Upgrade Your Legal
                <span
                  className="block mt-1"
                  style={{
                    background: "linear-gradient(135deg, #60A5FA, #0EA5E9)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Practice Today
                </span>
              </h2>

              <div className="text-[16px] text-white/60 min-h-[2rem] mb-8">
                <TypewriterText
                  texts={TYPED}
                  typingSpeed={58}
                  deletingSpeed={28}
                  pauseMs={2500}
                  cursorClass="bg-brand-400"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3 mb-10 text-left max-w-xl mx-auto">
                {BENEFITS.map((b) => (
                  <div key={b} className="flex items-start gap-3">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        background: "rgba(16,185,129,0.15)",
                        border: "1px solid rgba(16,185,129,0.3)",
                      }}
                    >
                      <Check className="w-3 h-3 text-emerald-400" />
                    </div>
                    <span className="text-white/70 text-[13px] leading-relaxed">{b}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap justify-center gap-4">
                <button className="btn-primary px-10 py-4 text-[15px]">
                  <Zap className="w-4 h-4" />
                  Start Drafting Free
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  className="inline-flex items-center justify-center gap-2 px-10 py-4
                             rounded-xl font-semibold text-[15px] text-white/80
                             transition-all duration-200 hover:text-white active:scale-95"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                  }}
                >
                  Book a Demo
                </button>
              </div>

              <p className="text-white/25 text-[12px] mt-5">
                No credit card required · Free plan available · Cancel anytime
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}