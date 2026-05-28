"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/provider";
import type { SupabaseClient } from "@supabase/supabase-js";

type AvailabilityDay = {
  id: string;
  date: string;
  is_available: boolean;
};

const DAY_NAMES_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DAY_NAMES_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatWeekLabel(weekStart: Date, lang: string): string {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const fmt = (d: Date) =>
    d.toLocaleDateString(lang === "es" ? "es-CO" : "en-US", opts);
  return `${fmt(start)} – ${fmt(end)}`;
}

export default function AdminDisponibilidad() {
  const { dict, lang } = useI18n();
  const DAYS = lang === "es" ? DAY_NAMES_ES : DAY_NAMES_EN;
  const supabaseRef = useRef<SupabaseClient | null>(null);
  const [days, setDays] = useState<AvailabilityDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekInput, setWeekInput] = useState("");
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const loadData = () => {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    supabaseRef.current
      .from("availability_days")
      .select("*")
      .order("date", { ascending: false })
      .then(({ data }) => {
        if (data) setDays(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ── Group days by week ── */
  const weeks = new Map<string, AvailabilityDay[]>();
  for (const d of days) {
    const monday = getMonday(new Date(d.date + "T12:00:00"));
    const key = formatDate(monday);
    if (!weeks.has(key)) weeks.set(key, []);
    weeks.get(key)!.push(d);
  }
  const weekEntries = Array.from(weeks.entries()).sort((a, b) =>
    b[0].localeCompare(a[0])
  );

  /* ── Add a week (creates 7 days) ── */
  const addWeek = async () => {
    if (!weekInput) return;
    if (!supabaseRef.current) supabaseRef.current = createClient();

    const monday = getMonday(new Date(weekInput + "T12:00:00"));
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      dates.push(formatDate(d));
    }

    const existing = new Set(days.map((d) => d.date));
    const toInsert = dates
      .filter((d) => !existing.has(d))
      .map((d) => ({ date: d, is_available: true }));

    if (toInsert.length === 0) return;

    await supabaseRef.current.from("availability_days").insert(toInsert);
    setWeekInput("");
    loadData();
  };

  /* ── Toggle a single day ── */
  const toggleDay = async (id: string, current: boolean) => {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    setSaving({ ...saving, [id]: true });
    await supabaseRef.current
      .from("availability_days")
      .update({ is_available: !current })
      .eq("id", id);
    setSaving({ ...saving, [id]: false });
    loadData();
  };

  /* ── Delete a whole week ── */
  const deleteWeek = async (weekKey: string) => {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    const weekDays = weeks.get(weekKey) || [];
    const ids = weekDays.map((d) => d.id);
    await supabaseRef.current
      .from("availability_days")
      .delete()
      .in("id", ids);
    loadData();
  };

  const todayStr = formatDate(new Date());

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">

      {/* ── Hero header ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-red-700 rounded-2xl p-8 mb-8 shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
          <svg viewBox="0 0 100 100" className="w-full h-full text-white" fill="currentColor">
            <rect x="40" y="10" width="20" height="80" rx="4" />
            <rect x="10" y="40" width="80" height="20" rx="4" />
          </svg>
        </div>
        <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{dict.admin.disponibilidad}</h1>
          </div>
          <p className="text-white/80 text-sm sm:text-base">
            {days.filter((d) => d.is_available).length} {dict.admin.diasDisponibles}
          </p>
        </div>
      </div>

      {/* ── Week adder ── */}
      <div className="bg-white border-2 border-primary/10 rounded-2xl p-5 mb-8 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-semibold mb-1.5">
              {dict.admin.semanaDel}
            </label>
            <input
              type="date"
              value={weekInput}
              onChange={(e) => setWeekInput(e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm"
            />
          </div>
          <button
            onClick={addWeek}
            disabled={!weekInput}
            className="self-end inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary-hover transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {dict.admin.agregarSemana}
          </button>
        </div>
        {weekInput && (
          <p className="text-xs text-zinc-500 mt-2">
            {dict.admin.semanaDel}: <strong>{formatWeekLabel(getMonday(new Date(weekInput + "T12:00:00")), lang)}</strong>
            {" — "}{dict.admin.diasDisponibles}: 7
          </p>
        )}
      </div>

      {/* ── Weeks list ── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-border rounded-xl p-5 animate-pulse">
              <div className="h-5 bg-zinc-200 rounded w-1/3 mb-3" />
              <div className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-8 bg-zinc-100 rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : weekEntries.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3 opacity-30">📅</div>
          <p className="text-zinc-400 text-lg">{dict.admin.noWeeks}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {weekEntries.map(([weekKey, weekDays]) => {
            const availableCount = weekDays.filter((d) => d.is_available).length;
            const mondayDate = new Date(weekKey + "T12:00:00");
            const sorted = [...weekDays].sort(
              (a, b) => a.date.localeCompare(b.date)
            );
            return (
              <div
                key={weekKey}
                className="bg-white border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Week header */}
                <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-zinc-50 to-white border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-base">
                        {formatWeekLabel(mondayDate, lang)}
                      </h3>
                      <p className="text-xs text-zinc-500">
                        {availableCount}/7 {dict.admin.diasDisponibles}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteWeek(weekKey)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-500 border border-transparent hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {dict.admin.eliminar}
                  </button>
                </div>

                {/* Days */}
                <div className="divide-y divide-border">
                  {sorted.map((day) => {
                    const dateObj = new Date(day.date + "T12:00:00");
                    const dayOfWeek = dateObj.getDay();
                    const isPast = day.date < todayStr;
                    return (
                      <div
                        key={day.id}
                        className={`flex items-center justify-between px-5 py-3 transition-colors ${day.is_available ? "" : "bg-red-50/40"}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-zinc-500">
                              {DAYS[dayOfWeek]}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <span className="font-medium text-sm">
                              {dateObj.toLocaleDateString(
                                lang === "es" ? "es-CO" : "en-US",
                                { month: "short", day: "numeric" }
                              )}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleDay(day.id, day.is_available)}
                          disabled={saving[day.id] || isPast}
                          className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-1 cursor-pointer
                            ${day.is_available ? "bg-green-500" : "bg-zinc-300"}
                            ${isPast ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition duration-200
                              ${day.is_available ? "translate-x-5" : "translate-x-0"}`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
