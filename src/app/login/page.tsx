"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/provider";
import type { SupabaseClient } from "@supabase/supabase-js";

export default function LoginPage() {
  const { dict } = useI18n();
  const supabaseRef = useRef<SupabaseClient | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }
    const supabase = supabaseRef.current;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm border border-border/60 rounded-2xl p-8 shadow-lg bg-white card-glow">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center">
            <span className="text-primary text-xl font-bold">+</span>
          </div>
        </div>
        <h1 className="text-xl font-bold text-center mb-6">
          {dict.nav.iniciarSesion}
        </h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-border rounded-lg px-3 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="password"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-border rounded-lg px-3 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white rounded-lg py-2.5 font-medium hover:bg-primary-hover disabled:opacity-50 transition-colors"
          >
            {loading ? "..." : dict.nav.iniciarSesion}
          </button>
        </form>
      </div>
    </div>
  );
}
