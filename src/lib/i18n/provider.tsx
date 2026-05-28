"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { getDictionary, type Lang, type Dict } from "./dictionary";

type I18nContextType = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  dict: Dict;
};

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("es");

  const dict = getDictionary(lang);

  return (
    <I18nContext.Provider value={{ lang, setLang, dict }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
