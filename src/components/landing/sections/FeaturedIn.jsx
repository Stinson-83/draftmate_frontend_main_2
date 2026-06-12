import ScrollReveal from "@/components/landing/ScrollReveal";

const PUBLISHERS = [
  { name: "India Shorts", src: "/featured_in/india_shorts.png" },
  { name: "Business Upturn", src: "/featured_in/Business_Upurn.png" },
  { name: "Karo Startup", src: "/featured_in/Karo_Straup.webp" },
  { name: "Vie Stories", src: "/featured_in/Vie_Sories.webp" },
  { name: "Business News This Week", src: "/featured_in/businessnewsthisweek.png" },
  { name: "Karnataka News Network", src: "/featured_in/Karnataka_News_Network.png" },
  { name: "India Wire News", src: "/featured_in/India_Wire_News.png" },
  { name: "Kerala News Journal", src: "/featured_in/Kerala_News_Journal.png" },
  { name: "India News Connect", src: "/featured_in/India_News_Connect.png" },
  { name: "Andhra News Digest", src: "/featured_in/Andhra_news_digest.png" },
  { name: "Bihar News", src: "/featured_in/Bihar_news.png" },
  { name: "Indian Daily Press", src: "/featured_in/indian_daily_press.png" },
  { name: "Maharashtra NewsFlash", src: "/featured_in/Maharashtra_NewsFlash.png" },
  { name: "Nagaland News", src: "/featured_in/Nagaland_news.png" },
  { name: "Punjab News", src: "/featured_in/punjab_news.png" },
  { name: "Sandwich", src: "/featured_in/sandwich.png" },
  { name: "Tamilnadu", src: "/featured_in/Tamilnadu.png" },
];

const ROW_2 = [...PUBLISHERS].reverse();

function Pill({ name, src }) {
  return (
    <div
      className="inline-flex items-center justify-center px-6 mx-2.5 rounded-full
                 shrink-0 cursor-default transition-all duration-200 hover:shadow-md
                 select-none h-14"
      style={{
        background: "rgba(255,255,255,0.9)",
        border: "1px solid rgba(226,232,240,0.8)",
        boxShadow: "0 1px 3px rgba(15,28,46,0.05)",
        minWidth: "140px",
      }}
    >
      <img
        src={src}
        alt={name}
        className="w-[120px] h-[36px]" 
      />
    </div>
  );
}

function MarqueeRow({ items, reverse }) {
  const doubled = [...items, ...items];
  return (
    <div className="overflow-hidden">
      <div
        className={`flex w-max ${reverse ? "animate-marquee-right" : "animate-marquee-left"
          }`}
        style={{ willChange: "transform" }}
      >
        {doubled.map((item, i) => (
          <Pill key={i} name={item.name} src={item.src} />
        ))}
      </div>
    </div>
  );
}

export default function FeaturedIn() {
  return (
    <section className="py-20 divider relative overflow-hidden bg-white/40">
      <div className="container-xl px-5 md:px-10 mb-10">
        <ScrollReveal>
          <div className="text-center space-y-2">
            <p className="text-[11px] tracking-[0.25em] uppercase text-ink/30 font-semibold">
              As Featured In 212+ Publishers
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-ink">
              Trusted by India&apos;s Leading Legal Media
            </h2>
          </div>
        </ScrollReveal>
      </div>

      <div className="relative marquee-group">
        {/* Fade masks */}
        <div
          className="absolute left-0 top-0 bottom-0 w-28 z-10 pointer-events-none"
          style={{
            background:
              "linear-gradient(to right, rgba(248,250,255,1), transparent)",
          }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-28 z-10 pointer-events-none"
          style={{
            background:
              "linear-gradient(to left, rgba(248,250,255,1), transparent)",
          }}
        />

        <div className="space-y-3">
          <MarqueeRow items={PUBLISHERS} />
          <MarqueeRow items={ROW_2} reverse />
        </div>
      </div>

      {/* LawJurist badge */}
      <div className="container-xl px-5 md:px-10 mt-12">
        <ScrollReveal delay={200}>
          <div className="flex justify-center">
            <div className="surface-card rounded-2xl px-8 py-5 flex items-center gap-5 card-lift">
              <div className="flex items-center gap-4">
                <img
                  src="/Lawjurist.jpeg"
                  alt="LawJurist"
                  className="w-[120px] h-[40px]"
                />

                <div>
                  <h3 className="font-bold text-lg">
                    Backed by the Law Jurist
                  </h3>

                  <p className="text-sm text-slate-500">
                    India's Largest Legal Community Network
                  </p>
                </div>
              </div>

            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}