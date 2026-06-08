import { Mail, Phone, Linkedin, Facebook, Instagram, Youtube } from "lucide-react";
import ScrollReveal from "@/components/landing/ScrollReveal";

const LINKS = {
  Product:   ["Features", "Pricing", "How It Works", "Changelog", "Lex Bot"],
  Legal:     ["Privacy Policy", "Terms of Service", "DPDPA Compliance", "Refund Policy", "Cookie Policy"],
  Community: ["LawJurist", "Blog", "Case Studies", "Webinars", "Advocate Network"],
  Company:   ["About Us", "Careers", "Press Kit", "Contact", "Partner with Us"],
};

export default function Footer() {
  return (
    <footer
      style={{
        background: "linear-gradient(160deg, #070E1A 0%, #0A1628 50%, #0D1E38 100%)",
        borderTop: "1px solid rgba(37,99,235,0.12)",
      }}
      className="relative"
    >
      <div className="relative w-full max-w-7xl mx-auto px-5 md:px-10 py-16 lg:py-24">
        <ScrollReveal>
          {/* Top section */}
          <div className="grid lg:grid-cols-6 gap-10 md:gap-12 mb-16">

            {/* Brand & Info */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* Logo Area */}
              <div className="flex items-center gap-3">
                <div className="relative w-11 h-11">
                  <img
                    src="/logo.png"
                    alt="Draftmate.in"
                    className="w-[44px] h-[44px] object-contain" 
                  />
                </div>
                <div>
                  <div className="font-bold text-[20px] text-white leading-tight">
                    Draftmate
                  </div>
                  <div className="text-[10px] tracking-wider uppercase font-medium mt-0.5"
                    style={{ color: "#94A3B8" }}>
                    Your AI Assistant in Law
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-3 mt-2">
                <a href="mailto:draftmate25@gmail.com" className="flex items-center gap-3 text-[#CBD5E1] hover:text-white transition-colors text-[14.5px]">
                  <Mail className="w-4 h-4 text-[#94A3B8]" />
                  draftmate25@gmail.com
                </a>
                <a href="tel:+916360756930" className="flex items-center gap-3 text-[#CBD5E1] hover:text-white transition-colors text-[14.5px]">
                  <Phone className="w-4 h-4 text-[#94A3B8]" />
                  +91 6360756930
                </a>
              </div>

              {/* Registration Info */}
              <div className="space-y-2 mt-2">
                <div className="text-[#CBD5E1] text-[14px]">
                  <span className="text-[#94A3B8] font-semibold mr-2">CIN:</span> 
                  U62090BR2026PTC082255
                </div>
                <div className="text-[#CBD5E1] text-[14px]">
                  <span className="text-[#94A3B8] font-semibold mr-2">PAN:</span> 
                  AAMCD4217D
                </div>
              </div>

              {/* Social Icons */}
              <div className="flex gap-4 mt-2 items-center">
                <a href="#" className="text-[#94A3B8] hover:text-white transition-colors">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a href="#" className="text-[#94A3B8] hover:text-white transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="#" className="text-[#94A3B8] hover:text-white transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="text-[#94A3B8] hover:text-white transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="text-[#94A3B8] hover:text-white transition-colors">
                  <Youtube className="w-5 h-5" />
                </a>
              </div>

              {/* DPIIT Startup India */}
              <div className="mt-4">
                <div className="text-[12px] text-[#94A3B8] mb-2 font-medium">Registered with</div>
                <div className="relative w-[140px] h-[45px] bg-white rounded flex items-center justify-center p-1.5">
                  <img
                    src="/startup_india_logo.png" 
                    alt="DPIIT Startup India" 
                    className="w-full h-full object-contain p-1"
                  />
                </div>
              </div>
            </div>

            {/* Link columns */}
            {Object.entries(LINKS).map(([cat, items]) => (
              <div key={cat} className="pt-2">
                <h4
                  className="text-[12px] font-semibold mb-5 tracking-widest uppercase"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  {cat}
                </h4>
                <ul className="space-y-3">
                  {items.map((item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="text-[13px] transition-colors duration-200"
                        style={{ color: "rgba(255,255,255,0.3)" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.85)")}
                        onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
                      >
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Divider with glow */}
          <div style={{
            height: "1px",
            background: "linear-gradient(to right, transparent, rgba(37,99,235,0.3), rgba(14,165,233,0.2), transparent)",
            marginBottom: "32px",
          }} />

          {/* Bottom bar */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[12px]" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
              © 2026 DraftMate Pvt Ltd. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              {["Privacy Policy", "Terms", "Contact"].map((l) => (
                <a key={l} href="#" className="text-[12px] transition-colors duration-200"
                  style={{ color: "rgba(255, 255, 255, 0.9)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.2)")}>
                  {l}
                </a>
              ))}
            </div>
            <p className="text-[12px]" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
              Made in India with Love 💖
            </p>
          </div>
        </ScrollReveal>
      </div>
    </footer>
  );
}