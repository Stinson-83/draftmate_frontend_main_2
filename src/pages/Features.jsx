import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import fullLogo from '../assets/FULL_LOGO.svg';
import Footer from '../components/landing/sections/Footer';

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ─── Animated Counter ─────────────────────────────────────────────────────────

const AnimatedCounter = ({ end, duration = 2200, suffix = '', prefix = '' }) => {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView(0.1);

  useEffect(() => {
    if (!inView) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(step);
      else setCount(end);
    };
    requestAnimationFrame(step);
  }, [inView, end, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
};

// ─── Particle Background ──────────────────────────────────────────────────────

const ParticleCanvas = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    const particles = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.3 + 0.05,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59,130,246,${p.alpha})`;
        ctx.fill();
      });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(59,130,246,${0.08 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
};

// ─── Reveal Wrapper ───────────────────────────────────────────────────────────

const Reveal = ({ children, delay = 0, direction = 'up', className = '' }) => {
  const { ref, inView } = useInView(0.1);
  const dirs = {
    up:    'opacity-0 translate-y-12',
    left:  'opacity-0 -translate-x-12',
    right: 'opacity-0 translate-x-12',
    scale: 'opacity-0 scale-90',
  };
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${inView ? 'opacity-100 translate-y-0 translate-x-0 scale-100' : dirs[direction]} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

// ─── Feature Card ─────────────────────────────────────────────────────────────

const FeatureCard = ({ icon, title, description, color, delay }) => {
  const { ref, inView } = useInView(0.1);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      ref={ref}
      className="feature-card group relative bg-white rounded-2xl p-8 border border-slate-200 cursor-pointer overflow-hidden shadow-sm hover:shadow-xl"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0) scale(1)' : 'translateY(50px) scale(0.93)',
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="absolute inset-0 rounded-2xl transition-opacity duration-500"
        style={{ background: `radial-gradient(circle at 30% 30%, ${color}10, transparent 70%)`, opacity: hovered ? 1 : 0 }}
      />
      <div
        className="absolute top-0 left-0 right-0 h-[2px] transition-opacity duration-500"
        style={{ background: `linear-gradient(to right, transparent, ${color}, transparent)`, opacity: hovered ? 1 : 0 }}
      />
      <div
        className="relative size-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6"
        style={{ background: `linear-gradient(135deg, ${color}20, ${color}35)` }}
      >
        <span className="material-symbols-outlined text-3xl transition-transform duration-500" style={{ color, fontSize: '30px' }}>{icon}</span>
      </div>
      <h3 className="relative text-xl font-bold mb-3 transition-colors duration-300 text-slate-800" style={{ color: hovered ? color : '' }}>
        {title}
      </h3>
      <p className="relative text-slate-500 leading-relaxed text-sm">{description}</p>
      <div
        className="absolute bottom-0 left-4 right-4 h-[1px] transition-opacity duration-500"
        style={{ background: `linear-gradient(to right, transparent, ${color}40, transparent)`, opacity: hovered ? 1 : 0 }}
      />
    </div>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({ icon, value, suffix, label, color, delay }) => {
  const { ref, inView } = useInView(0.1);
  return (
    <div
      ref={ref}
      className="relative group text-center"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.9)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      <div
        className="absolute inset-0 rounded-2xl blur-xl transition-opacity duration-500 group-hover:opacity-40 opacity-0"
        style={{ background: `${color}25` }}
      />
      <div className="relative bg-white backdrop-blur-sm border border-slate-200 rounded-2xl p-8 group-hover:border-blue-200 transition-all duration-300 shadow-sm hover:shadow-lg">
        <div className="relative inline-flex items-center justify-center mb-4">
          <div
            className="absolute size-14 rounded-full animate-ping opacity-10"
            style={{ background: color, animationDuration: '2s', animationDelay: `${delay}ms` }}
          />
          <span className="material-symbols-outlined text-4xl relative z-10" style={{ color, fontSize: '40px' }}>{icon}</span>
        </div>
        <div className="text-5xl font-black text-slate-800 mb-2 tabular-nums">
          {inView && <AnimatedCounter end={value} suffix={suffix} duration={2000} />}
        </div>
        <p className="text-slate-500 font-medium text-sm uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
};

// ─── Timeline Step ────────────────────────────────────────────────────────────

const WorkflowStep = ({ step, icon, title, desc, color, delay, isLast, nextColor }) => {
  const { ref, inView } = useInView(0.15);
  return (
    <div
      ref={ref}
      className="relative flex flex-col items-center text-center"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(40px)',
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      <div className="relative mb-4 w-full flex justify-center">
        {/* Left-extending line with dot for Step 1 */}
        {step === 1 && (
          <div 
            className="hidden md:block absolute top-10 h-[2px] overflow-hidden"
            style={{
              left: 'calc(50% - 104px)',
              width: '60px',
            }}
          >
            <div
              className="h-full"
              style={{
                background: `linear-gradient(to right, #C4B5FD, ${color})`,
                width: inView ? '100%' : '0%',
                transition: `width 1s ease ${delay + 400}ms`,
              }}
            />
            {/* Start Dot */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white z-10" />
          </div>
        )}

        {/* Connecting line to the right (for Steps 1, 2, 3) */}
        {!isLast && (
          <div 
            className="hidden md:block absolute top-10 h-[2px] overflow-hidden"
            style={{
              left: 'calc(50% + 44px)',
              width: 'calc(100% - 88px)',
            }}
          >
            <div
              className="h-full"
              style={{
                background: `linear-gradient(to right, ${color}, ${nextColor || '#C4B5FD'})`,
                width: inView ? '100%' : '0%',
                transition: `width 1s ease ${delay + 400}ms`,
              }}
            />
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 transition-opacity duration-300"
              style={{ opacity: inView ? 1 : 0, transitionDelay: `${delay + 900}ms` }}
            >
              <div className="w-0 h-0 border-t-4 border-b-4 border-l-8 border-t-transparent border-b-transparent" style={{ borderLeftColor: nextColor || '#C4B5FD' }} />
            </div>
          </div>
        )}

        {/* Right-extending line with dot for the Last Step */}
        {isLast && (
          <div 
            className="hidden md:block absolute top-10 h-[2px] overflow-hidden"
            style={{
              left: 'calc(50% + 44px)',
              width: '60px',
            }}
          >
            <div
              className="h-full"
              style={{
                background: `linear-gradient(to right, ${color}, #C4B5FD)`,
                width: inView ? '100%' : '0%',
                transition: `width 1s ease ${delay + 400}ms`,
              }}
            />
            {/* End Dot */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white z-10" />
          </div>
        )}

        <div className="relative size-20">
          <div
            className="size-20 rounded-full flex items-center justify-center border-2 transition-all duration-500"
            style={{
              background: `linear-gradient(135deg, ${color}30, ${color}15)`,
              borderColor: inView ? color : 'transparent',
              boxShadow: inView ? `0 0 30px ${color}50` : 'none',
            }}
          >
            <span className="material-symbols-outlined text-3xl" style={{ color, fontSize: '32px' }}>{icon}</span>
          </div>
          <div
            className="absolute -top-2 -right-2 size-7 rounded-full flex items-center justify-center text-xs font-black text-white shadow-lg"
            style={{ background: color }}
          >
            {step}
          </div>
        </div>
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-blue-100 text-sm leading-relaxed max-w-[160px]">{desc}</p>
    </div>
  );
};

// ─── Tab Mock Visual ──────────────────────────────────────────────────────────

const MockVisual = ({ activeTab }) => (
  <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl p-5 shadow-xl border border-slate-200 overflow-hidden">
    <div className="flex items-center gap-2 mb-4">
      <div className="w-3 h-3 rounded-full bg-red-400" />
      <div className="w-3 h-3 rounded-full bg-yellow-400" />
      <div className="w-3 h-3 rounded-full bg-green-400" />
      <div className="ml-4 flex-1 h-6 bg-white rounded-md text-xs flex items-center px-3 text-slate-400 font-mono border border-slate-200">
        draftmate.ai/{['drafting', 'research', 'analysis'][activeTab]}
      </div>
    </div>
    <div className="bg-white rounded-xl p-5 min-h-[280px] transition-all duration-500 shadow-sm">
      {activeTab === 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-5">
            <span className="material-symbols-outlined text-blue-500 text-3xl">edit_document</span>
            <span className="font-bold text-slate-900 text-lg">AI Draft Generator</span>
            <span className="ml-auto text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">✓ Ready</span>
          </div>
          <div className="space-y-2">
            {[1, 0.75, 0.833].map((w, i) => (
              <div key={i} className="h-3 bg-slate-100 rounded-full overflow-hidden" style={{ width: `${w * 100}%` }}>
                <div className="h-full bg-gradient-to-r from-blue-200 to-blue-300 rounded-full" />
              </div>
            ))}
          </div>
          <div className="mt-5 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-xl">
            <div className="flex items-center gap-2 text-blue-600 font-bold text-xs mb-2">
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              AI Suggestion Applied
            </div>
            <div className="h-2.5 bg-blue-200 rounded w-full mb-1.5" />
            <div className="h-2.5 bg-blue-100 rounded w-4/5" />
          </div>
          <div className="flex gap-2 mt-4">
            <div className="flex-1 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">Export PDF</div>
            <div className="flex-1 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 text-xs font-bold">Edit Draft</div>
          </div>
        </div>
      )}
      {activeTab === 1 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-5">
            <span className="material-symbols-outlined text-purple-600 text-3xl">smart_toy</span>
            <span className="font-bold text-slate-900 text-lg">Lex Bot</span>
            <span className="ml-auto flex items-center gap-1 text-xs text-green-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />Online
            </span>
          </div>
          <div className="p-3 bg-slate-100 rounded-xl text-sm text-slate-600 border border-slate-200">
            "What are the grounds for anticipatory bail under CrPC?"
          </div>
          <div className="p-4 bg-purple-50 border-l-4 border-purple-500 rounded-r-xl">
            <p className="text-sm text-slate-700 mb-2 leading-relaxed">Under Section 438 of CrPC, anticipatory bail may be granted when a person has reason to believe they may be arrested...</p>
            <div className="flex items-center gap-1.5 text-xs text-purple-600 font-semibold mt-2">
              <span>📚</span> Gurbaksh Singh Sibbia v. State of Punjab (1980) 2 SCC 565
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 border border-slate-200 rounded-lg">
            <input className="flex-1 text-sm outline-none text-slate-700 bg-transparent" placeholder="Ask a follow-up..." readOnly />
            <span className="material-symbols-outlined text-purple-500 text-lg cursor-pointer">send</span>
          </div>
        </div>
      )}
      {activeTab === 2 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-5">
            <span className="material-symbols-outlined text-amber-600 text-3xl">description</span>
            <span className="font-bold text-slate-900 text-lg">Document Analysis</span>
          </div>
          <div className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-amber-400 transition-colors cursor-pointer group">
            <span className="material-symbols-outlined text-2xl mb-1 group-hover:text-amber-400 transition-colors">upload_file</span>
            <span className="text-xs">Drop PDF to analyze</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: 'summarize', label: 'Summary', bg: 'bg-emerald-50', border: 'border-emerald-100', iconColor: 'text-emerald-600', textColor: 'text-emerald-700' },
              { icon: 'format_quote', label: 'Key Points', bg: 'bg-blue-50', border: 'border-blue-100', iconColor: 'text-blue-600', textColor: 'text-blue-700' },
              { icon: 'link', label: 'Citations', bg: 'bg-purple-50', border: 'border-purple-100', iconColor: 'text-purple-600', textColor: 'text-purple-700' },
              { icon: 'edit_note', label: 'Annotations', bg: 'bg-amber-50', border: 'border-amber-100', iconColor: 'text-amber-600', textColor: 'text-amber-700' },
            ].map((item, i) => (
              <div key={i} className={`p-3 ${item.bg} rounded-xl text-center border ${item.border}`}>
                <span className={`material-symbols-outlined text-xl ${item.iconColor}`}>{item.icon}</span>
                <p className={`text-xs font-semibold mt-1 ${item.textColor}`}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {activeTab === 3 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-5">
            <span className="material-symbols-outlined text-sky-600 text-3xl">draw</span>
            <span className="font-bold text-slate-900 text-lg">Digital E-Signature</span>
            <span className="ml-auto text-xs px-2.5 py-0.5 bg-sky-100 text-sky-700 rounded-full font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />IT Act 2000
            </span>
          </div>
          <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
              <span>Lease_Agreement_Final.docx</span>
              <span className="text-sky-600 font-bold">Aadhaar eSign</span>
            </div>
            <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-sky-100 shadow-sm">
              <span className="material-symbols-outlined text-sky-600 text-2xl">verified_user</span>
              <div className="text-xs">
                <p className="font-bold text-slate-800">Digitally Signed by Advocate R. Sharma</p>
                <p className="text-slate-400">Timestamp: 2026-08-08 IST • Hash Verified</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 h-9 bg-sky-600 rounded-lg flex items-center justify-center text-white text-xs font-bold gap-1.5 cursor-pointer hover:bg-sky-700 transition-colors">
              <span className="material-symbols-outlined text-sm">edit_note</span> Request Client eSign
            </div>
            <div className="flex-1 h-9 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center text-slate-700 text-xs font-bold gap-1.5 cursor-pointer hover:bg-slate-200 transition-colors">
              <span className="material-symbols-outlined text-sm">verified</span> Verify Audit Trail
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);

// ─── Section Header ───────────────────────────────────────────────────────────

const SectionHeader = ({ badge, title, subtitle, light = false }) => {
  const { ref, inView } = useInView(0.1);
  return (
    <div
      ref={ref}
      className="text-center mb-16"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(30px)',
        transition: 'opacity 0.7s ease, transform 0.7s ease',
      }}
    >
      <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest mb-6 ${light ? 'border border-blue-200 bg-blue-50 text-blue-600' : 'border border-blue-200 bg-blue-50 text-blue-600'}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
        {badge}
      </div>
      <div className={`text-4xl md:text-5xl font-black leading-tight mb-4 ${light ? 'text-slate-800' : 'text-slate-800'}`}>
        {title}
      </div>
      <p className={`text-lg max-w-xl mx-auto ${light ? 'text-slate-600' : 'text-slate-500'}`}>{subtitle}</p>
    </div>
  );
};

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────

const Features = () => {
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    document.title = 'Features – DraftMate';
    window.scrollTo(0, 0);
  }, []);

  const mainFeatures = [
    { icon: 'edit_document',   title: 'AI-Powered Legal Drafting',     description: 'Generate court-ready petitions, agreements, affidavits, and legal notices in seconds with Indian legal context and precise court formatting.', color: '#3B82F6' },
    { icon: 'library_books',   title: 'Lex Bot Research Assistant',     description: 'Your personal legal research companion. Ask complex queries about Indian law and get precise answers with verified citations from SC & HCs.', color: '#8B5CF6' },
    { icon: 'verified',        title: 'Verified Case Citations',         description: 'Every citation is real and verified. Our AI only references actual judgments from authentic sources, eliminating hallucinated case laws.', color: '#10B981' },
    { icon: 'picture_as_pdf',  title: 'Smart PDF Editor',               description: 'Upload case files and chat with them. Extract summaries, key arguments, and relevant sections instantly with AI-powered analysis.', color: '#F59E0B' },
    { icon: 'draw',            title: 'Digital E-Signature & Signing', description: 'Execute agreements, affidavits, and legal contracts with legally binding Aadhaar-based eSign and secure digital signatures (IT Act compliant).', color: '#0284C7' },
    { icon: 'gavel',           title: 'eCourts Live Case Tracker',      description: 'Track case status, next hearing dates, cause lists, and auto-download latest orders directly synced with eCourts.', color: '#6366F1' },
    { icon: 'translate',       title: 'Vernacular Legal Translator',   description: 'Instant multi-language AI translation for court pleadings (Vernacular to English/Hindi) with side-by-side comparative editor.', color: '#E11D48' },
    { icon: 'menu_book',       title: 'Bare Acts & Judgment Library',   description: 'Search 500k+ Supreme Court & High Court precedents alongside updated Bare Acts including BNS, BNSS, and BSA.', color: '#059669' },
    { icon: 'psychology',      title: 'Personalized Writing Style',      description: 'The AI learns your unique drafting tone and vocabulary over time. Every document sounds exactly like you wrote it.', color: '#EC4899' },
    { icon: 'calculate',       title: 'Legal Calculators & Tools',       description: 'Built-in calculators for Court Fees, Limitation Periods, Interest and more — based on current Indian acts, regularly updated.', color: '#06B6D4' },
  ];

  const detailedFeatures = [
    {
      title: 'Smart AI Drafting', icon: 'edit_document', color: '#3B82F6',
      description: 'Transform raw case facts into professionally formatted legal documents',
      features: ['Support for 50+ document types (Petitions, Plaints, Applications)', 'Auto-formatting for Supreme Court, High Courts & District Courts', 'Intelligent clause suggestions based on case context', 'Built-in legal terminology and proper formatting', 'Voice-to-draft capability for quick input'],
    },
    {
      title: 'Lex Bot Research', icon: 'smart_toy', color: '#8B5CF6',
      description: 'Get instant answers with verified citations from Indian case law',
      features: ['Natural language legal queries in English or Hindi', 'Real-time access to SCC, AIR, and other reporters', 'Contextual understanding of IPC, CrPC, CPC & Constitution', 'Export research with proper citation format', 'Deep dive into specific acts and sections'],
    },
    {
      title: 'Document Intelligence', icon: 'description', color: '#F59E0B',
      description: 'Upload any legal document and extract insights instantly',
      features: ['PDF chat — ask questions about uploaded documents', 'Automatic summarization of lengthy judgments', 'Key argument and ratio extraction', 'Cross-reference with relevant case laws', 'Annotation and highlight capabilities'],
    },
    {
      title: 'Digital E-Signature', icon: 'draw', color: '#0284C7',
      description: 'Sign and execute legal documents digitally with full IT Act compliance',
      features: ['Aadhaar eSign & Digital Signature Certificate (DSC) integration', 'Multi-party sequential & parallel signing workflows', 'Tamper-evident audit trails with cryptographic verification', 'Instant email & WhatsApp signing invitations for clients', 'Full legal validity under Section 6A of Indian IT Act 2000'],
    },
  ];

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 text-slate-800 overflow-x-hidden min-h-screen">

      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-6 py-3 lg:px-20">
        <Link to="/" className="flex items-center gap-4">
          <div className="h-12 flex items-center justify-center hover:opacity-80 transition-opacity">
            <img src={fullLogo} alt="DraftMate" className="h-full object-contain" />
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/" className="text-slate-600 hover:text-primary transition-colors font-medium">
            ← Back to Home
          </Link>
          <Link
            to="/login"
            className="hidden sm:flex items-center justify-center rounded-lg h-10 px-6 bg-primary text-white font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[88vh] flex items-center justify-center px-4 py-24 overflow-hidden">
        <ParticleCanvas />

        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-300/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-300/20 rounded-full blur-[120px]" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-5 py-2 text-xs font-bold text-blue-600 uppercase tracking-widest mb-8 shadow-sm">
              <span className="text-blue-500">✦</span>
              Powerful Features for Modern Advocates
            </div>
          </Reveal>

          <Reveal delay={100}>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-6 text-slate-900">
              Everything You Need to
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                Modernize Your Practice
              </span>
            </h1>
          </Reveal>

          <Reveal delay={200}>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10">
              From AI-powered drafting to verified case research, DraftMate provides a complete toolkit designed specifically for Indian legal professionals.
            </p>
          </Reveal>

          <Reveal delay={300}>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/login" className="group flex items-center gap-2 rounded-xl h-14 px-8 bg-blue-600 text-white text-base font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 hover:-translate-y-1">
                <span className="material-symbols-outlined transition-transform duration-300 group-hover:rotate-12">rocket_launch</span>
                Start Free Trial
              </Link>
              <Link to="/how-it-works" className="group flex items-center gap-2 rounded-xl h-14 px-8 bg-white border border-slate-200 text-slate-700 text-base font-bold hover:bg-slate-50 hover:border-slate-300 transition-all hover:-translate-y-1 shadow-sm">
                <span className="material-symbols-outlined text-blue-500">play_circle</span>
                See How It Works
              </Link>
            </div>
          </Reveal>

          <div className="mt-20 flex flex-wrap justify-center gap-3">
            {['IPC & CrPC', 'SCC Verified', 'SC & HC Formats', 'Hindi Support', '50+ Templates'].map((tag, i) => (
              <Reveal key={tag} delay={400 + i * 80}>
                <div className="px-4 py-2 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-all cursor-default shadow-sm">
                  {tag}
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-400 text-xs animate-bounce">
          <span>Scroll to explore</span>
          <span className="material-symbols-outlined text-base">expand_more</span>
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────────────────────────── */}
      <section className="relative py-20 px-4 overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative z-10 max-w-5xl mx-auto">
          <Reveal className="text-center mb-12">
            <p className="text-blue-100 text-sm uppercase tracking-widest font-bold">By the numbers</p>
          </Reveal>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: 'description', value: 50,    suffix: '+',  label: 'Document Types',   color: '#60A5FA' },
              { icon: 'gavel',       value: 10000, suffix: '+',  label: 'Case Citations',   color: '#A78BFA' },
              { icon: 'speed',       value: 60,    suffix: '%',  label: 'Time Saved',       color: '#34D399' },
              { icon: 'verified',    value: 100,   suffix: '%',  label: 'Verified Sources', color: '#FCD34D' },
            ].map((s, i) => (
              <div
                key={i}
                className="text-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6"
              >
                <span className="material-symbols-outlined text-4xl mb-3 block" style={{ color: s.color }}>{s.icon}</span>
                <div className="text-4xl font-black text-white mb-1 tabular-nums">
                  <AnimatedCounter end={s.value} suffix={s.suffix} duration={2000} />
                </div>
                <p className="text-blue-100 text-xs uppercase tracking-wider font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CORE FEATURES GRID ──────────────────────────────────────────────── */}
      <section className="relative py-24 px-4 overflow-hidden bg-white">
        <div className="relative z-10 max-w-6xl mx-auto">
          <SectionHeader
            badge="Core Features"
            title={<>Powerful Next-Gen Tools to<br /><span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Transform Your Practice</span></>}
            subtitle="Everything an Indian advocate needs — in one intelligent platform."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mainFeatures.map((f, i) => (
              <FeatureCard key={i} {...f} delay={i * 100} />
            ))}
          </div>
        </div>
      </section>

      {/* ── DEEP DIVE TABS ──────────────────────────────────────────────────── */}
      <section className="relative py-24 px-4 overflow-hidden bg-gradient-to-b from-slate-50 to-white">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-300/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-300/50 to-transparent" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <SectionHeader
            badge="Deep Dive"
            title={<>Explore Features<br /><span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">In Detail</span></>}
            subtitle="See exactly how each feature helps you work smarter and faster."
          />

          <div className="flex flex-wrap justify-center gap-3 mb-14">
            {detailedFeatures.map((f, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                  activeTab === i
                    ? 'text-white shadow-lg scale-105'
                    : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 border border-slate-200'
                }`}
                style={activeTab === i ? { background: `linear-gradient(135deg, ${f.color}, ${f.color}bb)`, boxShadow: `0 8px 25px ${f.color}40` } : {}}
              >
                <span className="material-symbols-outlined text-base">{f.icon}</span>
                {f.title}
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <Reveal key={activeTab} direction="left">
              <div>
                <div
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4"
                  style={{ background: `${detailedFeatures[activeTab].color}15`, color: detailedFeatures[activeTab].color }}
                >
                  <span className="material-symbols-outlined text-sm">{detailedFeatures[activeTab].icon}</span>
                  {detailedFeatures[activeTab].title}
                </div>
                <h3 className="text-3xl md:text-4xl font-black text-slate-800 mb-4 leading-tight">
                  {detailedFeatures[activeTab].description}
                </h3>
                <p className="text-slate-500 mb-8">Everything you need to work faster and smarter with legal documents.</p>
                <ul className="space-y-3">
                  {detailedFeatures[activeTab].features.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 hover:bg-slate-100 transition-all"
                      style={{ animation: `slideInStep 0.5s ease ${i * 80}ms both` }}
                    >
                      <span
                        className="size-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: `${detailedFeatures[activeTab].color}20` }}
                      >
                        <span className="material-symbols-outlined text-xs" style={{ color: detailedFeatures[activeTab].color, fontSize: '12px' }}>check</span>
                      </span>
                      <span className="text-slate-600 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="#"
                  className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-xl font-bold text-white text-sm transition-all hover:-translate-y-0.5 hover:shadow-xl"
                  style={{
                    background: `linear-gradient(135deg, ${detailedFeatures[activeTab].color}, ${detailedFeatures[activeTab].color}bb)`,
                    boxShadow: `0 8px 25px ${detailedFeatures[activeTab].color}30`,
                  }}
                >
                  Try {detailedFeatures[activeTab].title}
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </a>
              </div>
            </Reveal>

            <Reveal key={`mock-${activeTab}`} direction="right" delay={100}>
              <MockVisual activeTab={activeTab} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── WORKFLOW ─────────────────────────────────────────────────────────── */}
      <section className="relative py-24 px-4 overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700">
        <div className="absolute inset-0 overflow-hidden opacity-10">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="absolute h-px bg-white" style={{ top: `${i * 14}%`, left: '-10%', right: '-10%', transform: 'rotate(-5deg)' }} />
          ))}
        </div>

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-bold text-white uppercase tracking-widest mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              How It Works
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">
              A Seamless Workflow<br />
              <span className="text-blue-200">From Facts to Filing</span>
            </h2>
            <p className="text-blue-100 text-lg max-w-xl mx-auto">Four simple steps to go from raw case details to a court-ready document.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-8">
            {[
              { step: 1, icon: 'input',         title: 'Input Facts',    desc: 'Enter case details via text, voice, or file upload',             color: '#93C5FD' },
              { step: 2, icon: 'psychology',     title: 'AI Analysis',    desc: 'AI identifies relevant laws, sections & precedents',              color: '#C4B5FD' },
              { step: 3, icon: 'edit_document',  title: 'Generate Draft', desc: 'Receive a perfectly formatted document with citations',           color: '#FCD34D' },
              { step: 4, icon: 'download',       title: 'Export & File',  desc: 'Edit, export to Word / PDF and file directly in court',          color: '#6EE7B7' },
            ].map((item, i, arr) => (
              <WorkflowStep key={item.step} {...item} delay={i * 200} isLast={i === arr.length - 1} nextColor={arr[i+1]?.color} />
            ))}
          </div>

          <Reveal delay={800} className="mt-16">
            <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-300 via-purple-300 to-emerald-300 rounded-full" style={{ width: '100%', animation: 'drawLine 2s ease 1s both' }} />
            </div>
            <div className="flex justify-between mt-2 text-xs text-blue-200">
              <span>Start</span><span>Analyse</span><span>Draft</span><span>Done ✓</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── MADE FOR INDIA ───────────────────────────────────────────────────── */}
      <section className="relative py-24 px-4 overflow-hidden bg-white">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-200 to-transparent" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <Reveal direction="left">
              <div>
                <div className="inline-flex items-center gap-2 text-blue-600 font-bold uppercase tracking-widest text-xs mb-4">
                  <span className="w-8 h-0.5 bg-blue-500 rounded" />
                  Made for India
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
                  Built Specifically for<br />
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Indian Legal Practice</span>
                </h2>
                <p className="text-slate-500 text-lg mb-8 leading-relaxed">
                  Unlike generic AI tools, DraftMate is trained on Indian statutes, case laws, and court procedures. Every feature is designed with the Indian advocate in mind.
                </p>
                <div className="space-y-3">
                  {[
                    { icon: 'account_balance', text: 'IPC, CrPC, CPC & 200+ Indian Acts',    color: '#3B82F6' },
                    { icon: 'gavel',           text: 'Supreme Court & High Court formatting', color: '#8B5CF6' },
                    { icon: 'translate',       text: 'Hindi & regional language support',     color: '#10B981' },
                    { icon: 'verified',        text: 'SCC, AIR & authentic reporters',        color: '#F59E0B' },
                  ].map((item, i) => (
                    <Reveal key={i} delay={i * 100} direction="left">
                      <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-blue-50 hover:border-blue-200 transition-all group cursor-default">
                        <div className="size-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}15` }}>
                          <span className="material-symbols-outlined text-xl" style={{ color: item.color }}>{item.icon}</span>
                        </div>
                        <span className="text-slate-600 font-medium group-hover:text-slate-900 transition-colors">{item.text}</span>
                        <span className="material-symbols-outlined ml-auto text-slate-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-all text-base">chevron_right</span>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal direction="right" delay={200}>
              <div className="relative">
                <div className="absolute -inset-8 bg-gradient-to-br from-blue-100/50 to-purple-100/50 rounded-3xl blur-3xl" />
                <div className="relative bg-white rounded-2xl p-8 border border-slate-200 shadow-xl">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="size-14 rounded-xl bg-blue-100 flex items-center justify-center">
                      <span className="material-symbols-outlined text-blue-600 text-3xl">balance</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">Indian Legal Database</h4>
                      <div className="flex items-center gap-1.5 text-green-600 text-xs font-medium mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        Updated in real-time
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'Case Laws Indexed',  value: '500K+', color: '#3B82F6' },
                      { label: 'Acts & Amendments',  value: '200+',  color: '#8B5CF6' },
                      { label: 'Court Templates',    value: '50+',   color: '#10B981' },
                      { label: 'Citation Accuracy',  value: '100%',  color: '#F59E0B' },
                    ].map((s, i) => (
                      <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-all group">
                        <span className="text-slate-500 text-sm group-hover:text-slate-700 transition-colors">{s.label}</span>
                        <span className="font-black text-lg" style={{ color: s.color }}>{s.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="absolute -top-4 -right-4 px-3 py-2 bg-green-500 rounded-xl shadow-lg shadow-green-500/40 animate-bounce">
                    <span className="text-white text-xs font-black">🇮🇳 India-First</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="relative py-28 px-4 overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-[100px]" />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-bold text-white uppercase tracking-widest mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Ready to get started?
            </div>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
              Ready to Transform<br />
              <span className="text-blue-200">Your Practice?</span>
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="text-xl text-blue-100 mb-10 max-w-xl mx-auto">
              Join thousands of advocates who are drafting faster, researching smarter, and delivering better results.
            </p>
          </Reveal>
          <Reveal delay={300}>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/login" className="group flex items-center gap-2 rounded-xl h-14 px-8 bg-white text-blue-700 text-base font-bold hover:bg-blue-50 transition-all shadow-2xl hover:shadow-white/20 hover:-translate-y-1">
                <span className="material-symbols-outlined transition-transform group-hover:rotate-12">rocket_launch</span>
                Start Free Trial
              </Link>
              <Link to="/how-it-works" className="flex items-center gap-2 rounded-xl h-14 px-8 bg-white/10 border border-white/30 text-white text-base font-bold hover:bg-white/20 transition-all hover:-translate-y-1">
                <span className="material-symbols-outlined">play_circle</span>
                Watch Demo
              </Link>
            </div>
          </Reveal>
          <Reveal delay={400}>
            <p className="text-blue-200 text-sm mt-6">No credit card required · 7-day free trial · Cancel anytime</p>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <Footer />

      <style>{`
        @keyframes orbitDot {
          from { transform: rotate(0deg) translateX(26px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(26px) rotate(-360deg); }
        }
        @keyframes slideInStep {
          from { opacity: 0; transform: translateX(-20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes drawLine {
          from { width: 0; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default Features;
