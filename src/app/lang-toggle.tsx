"use client";

import { useI18n } from "@/lib/i18n/provider";

export default function LangToggle() {
  const { lang, setLang } = useI18n();

  return (
    <button
      onClick={() => setLang(lang === "es" ? "en" : "es")}
      className="fixed bottom-4 right-4 z-50 bg-white border border-border text-primary px-3 py-1.5 rounded-full text-xs font-medium shadow-lg hover:shadow-red-200 hover:border-primary/40 transition-all duration-200"
    >
      {lang === "es" ? "EN" : "ES"}
    </button>
  );
}
