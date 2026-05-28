"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

export default function NavBar() {
  const { dict } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const supabaseRef = useRef<SupabaseClient | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabaseRef.current = supabase;
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSignOut = async () => {
    const supabase = supabaseRef.current;
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const linkClass = (path: string, exact = false) => {
    const active = exact ? pathname === path : pathname.startsWith(path);
    return `relative px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${
      active
        ? "bg-primary text-white shadow-sm"
        : "text-zinc-600 hover:text-primary hover:bg-primary-light"
    }`;
  };

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm"
          : "bg-white"
      }`}
    >
      <div className="mx-auto max-w-6xl flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-primary text-xl font-bold group-hover:scale-105 transition-transform duration-200">
            +
          </span>
          <span className="font-serif font-bold text-lg text-foreground tracking-tight">
            Jose Soler
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/" className={linkClass("/", true)}>
            {dict.nav.inicio}
          </Link>
          <Link href="/agendar" className={linkClass("/agendar")}>
            {dict.nav.agendar}
          </Link>
          <Link href="/temas" className={linkClass("/temas")}>
            {dict.nav.temas}
          </Link>
          {isLoggedIn ? (
            <>
              <Link href="/admin" className={linkClass("/admin")}>
                {dict.nav.admin}
              </Link>
              <button
                onClick={handleSignOut}
                className="ml-2 text-sm text-zinc-400 hover:text-red-500 transition-colors"
              >
                {dict.nav.cerrarSesion}
              </button>
            </>
          ) : (
            <Link href="/login" className={linkClass("/login")}>
              {dict.nav.iniciarSesion}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
