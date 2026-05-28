"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/provider";
import type { SupabaseClient } from "@supabase/supabase-js";

export default function AdminDashboard() {
  const { dict } = useI18n();
  const supabaseRef = useRef<SupabaseClient | null>(null);
  const [stats, setStats] = useState({
    pending: 0,
    confirmed: 0,
    completed: 0,
    total: 0,
  });

  useEffect(() => {
    const supabase = createClient();
    supabaseRef.current = supabase;
    supabase
      .from("monitorias")
      .select("status")
      .then(({ data }) => {
        if (data) {
          setStats({
            pending: data.filter((m) => m.status === "pending").length,
            confirmed: data.filter((m) => m.status === "confirmed").length,
            completed: data.filter((m) => m.status === "completed").length,
            total: data.length,
          });
        }
      });
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">{dict.admin.dashboard}</h1>
      <p className="text-zinc-500 mb-8">{dict.admin.bienvenido}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <div className="border border-border rounded-xl p-6 text-center">
          <p className="text-3xl font-bold text-primary">{stats.total}</p>
          <p className="text-sm text-zinc-500">{dict.admin.monitorias}</p>
        </div>
        <div className="border border-border rounded-xl p-6 text-center">
          <p className="text-3xl font-bold text-yellow-500">
            {stats.pending}
          </p>
          <p className="text-sm text-zinc-500">{dict.admin.pending}</p>
        </div>
        <div className="border border-border rounded-xl p-6 text-center">
          <p className="text-3xl font-bold text-green-500">
            {stats.confirmed}
          </p>
          <p className="text-sm text-zinc-500">{dict.admin.confirmed}</p>
        </div>
        <div className="border border-border rounded-xl p-6 text-center">
          <p className="text-3xl font-bold text-blue-500">
            {stats.completed}
          </p>
          <p className="text-sm text-zinc-500">{dict.admin.completed}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/monitorias"
          className="border border-border rounded-xl p-6 hover:shadow-md transition-shadow hover:border-primary"
        >
          <h2 className="text-lg font-semibold mb-1">
            {dict.admin.monitorias}
          </h2>
          <p className="text-sm text-zinc-500">
            {dict.admin.crear} / {dict.admin.confirmar}
          </p>
        </Link>
        <Link
          href="/admin/disponibilidad"
          className="border border-border rounded-xl p-6 hover:shadow-md transition-shadow hover:border-primary"
        >
          <h2 className="text-lg font-semibold mb-1">
            {dict.admin.disponibilidad}
          </h2>
          <p className="text-sm text-zinc-500">
            {dict.admin.agregarDisponibilidad}
          </p>
        </Link>
        <Link
          href="/admin/temas"
          className="border border-border rounded-xl p-6 hover:shadow-md transition-shadow hover:border-primary"
        >
          <h2 className="text-lg font-semibold mb-1">{dict.admin.temas}</h2>
          <p className="text-sm text-zinc-500">{dict.admin.agregarTema}</p>
        </Link>
      </div>
    </div>
  );
}
