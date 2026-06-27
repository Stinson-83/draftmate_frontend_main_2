import { CheckCircle2, XCircle } from "lucide-react";
import ScrollReveal from "@/components/landing/ScrollReveal";
import { useNavigate } from "react-router-dom";

const ROWS = [
  { feature: "Indian Case Law Knowledge",  generic: "Limited, often outdated",       dm: "Real-time & Verified"      },
  { feature: "Zero Hallucinations",        generic: "High risk of made-up citations",dm: "100% Verified Sources"     },
  { feature: "Document Formatting",        generic: "Plain text, needs reformatting", dm: "Court-Ready Templates"     },
  { feature: "End-to-End Workflow",        generic: "Requires multiple tools",        dm: "Fully Integrated"          },
  { feature: "Data Privacy",               generic: "Data used for training",         dm: "Encrypted & Private Vault" },
  { feature: "Legal Tone Customization",   generic: "Generic, robotic tone",          dm: "Learns Your Style"         },
  { feature: "BNS / New Penal Code",       generic: "No specialized knowledge",       dm: "Fully Trained & Updated"   },
  { feature: "Student Mode",               generic: "Not available",                  dm: "Dedicated Learning Mode"   },
  { feature: "Personal Workspace",         generic: "No dedicated workspace",         dm: "Custom Client Vault"       },
  { feature: "Lex Bot Research Assistant", generic: "Not available",                  dm: "Included in all plans"     },
];

export default function ComparisonSection() {
  const navigate = useNavigate();
  return (
    <section className="py-24 lg:py-32 border-b border-slate-200/60 bg-white/50">
      <div className="container-xl px-5 md:px-10">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="text-[11px] tracking-[0.25em] uppercase text-ink/30 font-semibold block mb-3">
              Comparison
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-ink mb-3">
              Why DraftMate Beats{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #1D4ED8, #2563EB)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Generic AI
              </span>
            </h2>
            <p className="text-ink/45 text-base">
              Specialized legal intelligence vs. general purpose chat.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <div
            className="rounded-3xl overflow-hidden"
            style={{
              background: "white",
              border: "1px solid rgba(226,232,240,0.8)",
              boxShadow: "0 4px 24px rgba(15,28,46,0.06), 0 1px 4px rgba(15,28,46,0.04)",
            }}
          >
            {/* Header */}
            <div
              className="grid grid-cols-3 px-8 py-5 border-b border-slate-100"
              style={{ background: "#F8FAFF" }}
            >
              <div className="text-[11px] tracking-widest uppercase text-ink/30 font-semibold flex items-center">
                Feature
              </div>
              <div className="text-ink/50 text-[13px] font-semibold flex items-center">
                Generic AI (ChatGPT)
              </div>
              <div className="flex items-center">
                <span className="font-bold text-[13px]" style={{ color: "#1D4ED8" }}>
                  DraftMate
                </span>
                <span
                  className="ml-3 px-2.5 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{
                    background: "rgba(37,99,235,0.08)",
                    color: "#1D4ED8",
                    border: "1px solid rgba(37,99,235,0.2)",
                  }}
                >
                  Specialized
                </span>
              </div>
            </div>

            {/* Rows */}
            {ROWS.map((row) => (
              <div
                key={row.feature}
                className="grid grid-cols-3 px-8 py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors duration-150"
              >
                <div className="text-ink text-[14px] font-medium flex items-center">
                  {row.feature}
                </div>
                <div className="flex items-center gap-3 text-slate-400 text-[13px]">
                  <XCircle className="w-4 h-4 text-red-400/70 shrink-0" />
                  <span className="hidden md:block">{row.generic}</span>
                </div>
                <div className="flex items-center gap-3 text-[13px]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-ink font-semibold hidden md:block">{row.dm}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <div className="text-center mt-10">
            <button onClick={() => navigate('/login')} className="btn-primary px-10 py-4 text-[15px]">
              Switch to DraftMate Today →
            </button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}