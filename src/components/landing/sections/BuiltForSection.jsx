import { Building2, CheckCircle2, ShieldCheck } from "lucide-react";
import ScrollReveal from "@/components/landing/ScrollReveal";

const PILLARS = [
  {
    icon: Building2,
    title: "Indian Context",
    desc: "Trained on BNS, CRPC, CPC & Indian Constitution.",
    accent: "#2563EB",
    bg: "rgba(37,99,235,0.06)",
  },
  {
    icon: CheckCircle2,
    title: "Verified Citations",
    desc: "Real-time links to Supreme Court & High Court judgments.",
    accent: "#0D9488",
    bg: "rgba(13,148,136,0.06)",
  },
  {
    icon: ShieldCheck,
    title: "Zero Hallucinations",
    desc: "Strict guardrails ensure no fake cases are invented.",
    accent: "#7C3AED",
    bg: "rgba(124,58,237,0.06)",
  },
];

export default function BuiltForSection() {
  return (
    <section className="py-16 border-t divider">
      <div className="container-xl px-5 md:px-10">
        <ScrollReveal>
          <p className="text-center text-[11px] tracking-[0.25em] uppercase font-semibold mb-12 text-ink/30">
            Built Specifically for Indian Legal Standards
          </p>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-6">
          {PILLARS.map((p, i) => (
            <ScrollReveal key={p.title} delay={i * 100}>
              <div
                className="
                    surface-card
                    rounded-2xl
                    p-7
                    card-lift
                    group
                    transition-all
                    duration-500
                    ease-out
                    hover:-translate-y-2
                    hover:shadow-[0_20px_50px_rgba(37,99,235,0.15)]
                    hover:bg-gradient-to-br
                    hover:from-blue-50
                    hover:to-white
                    border
                    border-transparent
                    hover:border-blue-100
                    relative overflow-hidden
                  "
              >
                <div
                  className="
                    absolute
                    inset-0
                    rounded-2xl
                    opacity-0
                    group-hover:opacity-100
                    transition-opacity
                    duration-500
                    pointer-events-none
                  "
                  style={{
                    background:
                      "radial-gradient(circle at top right, rgba(37,99,235,0.08), transparent 60%)",
                  }}
                />
                <div
                  className="
                      w-12
                      h-12
                      rounded-2xl
                      flex
                      items-center
                      justify-center
                      mb-5
                      transition-all
                      duration-500
                      group-hover:scale-110
                      group-hover:shadow-lg
                  "
                  style={{ background: p.bg }}
                >
                  <p.icon className="w-6 h-6" style={{ color: p.accent }} />
                </div>
                <h3 className="
                  text-[17px]
                  font-bold
                  text-ink
                  mb-2
                  transition-colors
                  duration-300
                  group-hover:text-blue-600
                ">{p.title}</h3>
                <p
                  className="
                      text-[14px]
                      text-ink/50
                      leading-relaxed
                      transition-colors
                      duration-300
                      group-hover:text-slate-600
                    "
                >{p.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}