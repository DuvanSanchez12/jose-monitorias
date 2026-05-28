"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";

export default function Home() {
  const { dict, lang } = useI18n();

  return (
    <div className="hero-gradient min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(220,38,38,0.15), 0 0 40px rgba(220,38,38,0.05); }
          50% { box-shadow: 0 0 30px rgba(220,38,38,0.25), 0 0 60px rgba(220,38,38,0.1); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUpCard {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-glow { animation: glowPulse 3s ease-in-out infinite; }
        .animate-fade-in-up { animation: fadeInUp 0.8s ease-out both; }
        .animate-fade-in-up-card { animation: fadeInUpCard 0.6s ease-out both; }
      `}</style>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(220,38,38,0.06),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(220,38,38,0.04),transparent_50%)]" />

      <div className="max-w-5xl w-full flex flex-col md:flex-row items-center gap-10 md:gap-16 relative z-10">
        <div className="relative shrink-0 animate-float">
          <div className="absolute -inset-3 rounded-full bg-gradient-to-br from-primary/20 to-transparent blur-xl animate-glow" />
          <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-[3px] border-white shadow-2xl shadow-primary/20">
            <Image
              src="/jose.png"
              alt="Jose Gilberto Soler Callejas"
              fill
              className="object-cover object-[center_35%]"
              priority
            />
          </div>
        </div>

        <div className="flex flex-col items-center md:items-start text-center md:text-left gap-5 max-w-lg">
          <div className="animate-fade-in-up inline-flex items-center gap-2 bg-primary-light text-primary text-xs font-medium px-4 py-1.5 rounded-full" style={{ animationDelay: "0.1s" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {dict.hero.subtitle}
          </div>

          <h1 className="animate-fade-in-up text-3xl md:text-5xl font-bold leading-tight text-foreground" style={{ animationDelay: "0.2s" }}>
            Jose Gilberto{" "}
            <span className="text-primary">Soler Callejas</span>
          </h1>

          <p className="animate-fade-in-up text-base text-zinc-500 flex items-center gap-2" style={{ animationDelay: "0.3s" }}>
            <Image src="/logo-tolima.png" alt="Universidad del Tolima" width={20} height={20} className="object-contain" />
            {dict.hero.university}
          </p>

          <p className="animate-fade-in-up text-zinc-500 leading-relaxed max-w-md" style={{ animationDelay: "0.4s" }}>
            {dict.hero.description}
          </p>

          <div className="animate-fade-in-up flex flex-wrap gap-3 mt-2" style={{ animationDelay: "0.5s" }}>
            <Link
              href="/agendar"
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:bg-primary-hover transition-all duration-200 active:scale-95"
            >
              {dict.hero.cta}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 border border-border px-6 py-3 rounded-full font-medium text-zinc-600 hover:bg-primary-light hover:border-primary/30 hover:text-primary transition-all duration-200"
            >
              {dict.hero.login}
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-3 gap-6 md:gap-12 max-w-lg relative z-10">
        {[
          { value: "5to", label: lang === "es" ? "Semestre" : "Semester" },
          { value: lang === "es" ? "Medicina" : "Medicine", label: lang === "es" ? "Programa" : "Program" },
          { value: "UT", label: lang === "es" ? "Universidad" : "University" },
        ].map((item, i) => (
          <div
            key={i}
            className="animate-fade-in-up-card text-center p-4 rounded-2xl bg-white/70 backdrop-blur-sm border border-border/50 card-glow"
            style={{ animationDelay: `${0.7 + i * 0.15}s` }}
          >
            <div className="text-lg font-bold text-primary">{item.value}</div>
            <div className="text-xs text-zinc-400 mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
