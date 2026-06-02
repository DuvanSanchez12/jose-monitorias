"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/provider";
import type { SupabaseClient } from "@supabase/supabase-js";

type Monitoria = {
  id: string;
  student_name: string;
  student_email: string;
  student_phone: string | null;
  semester: string | null;
  program: string | null;
  topic: string | null;
  description: string | null;
  mode: string;
  status: string;
  scheduled_date: string;
  scheduled_time: string;
  created_by: string;
  created_at: string;
};

const STATUS_LIST = ["pending", "confirmed", "completed", "cancelled"] as const;

const STATUS_ICONS: Record<string, string> = {
  pending: "🕐",
  confirmed: "✅",
  completed: "✓",
  cancelled: "✕",
};

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; strip: string; hover: string }> = {
  pending: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    strip: "bg-amber-400",
    hover: "hover:bg-amber-100",
  },
  confirmed: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    strip: "bg-green-500",
    hover: "hover:bg-green-100",
  },
  completed: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    strip: "bg-blue-500",
    hover: "hover:bg-blue-100",
  },
  cancelled: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    strip: "bg-red-400",
    hover: "hover:bg-red-100",
  },
};

function formatDateNatural(ds: string): string {
  const d = new Date(ds + "T12:00:00");
  const parts = d.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" }).split(" ");
  return `${parts[0]}, ${parts[1]} ${parts[2]} ${parts[3]}`;
}

function formatTimeNatural(t: string): string {
  const start = t.includes("-") ? t.split("-")[0].trim() : t;
  const [h, m] = start.split(":").map(Number);
  const period = h >= 12 ? "p.m." : "a.m.";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
}

const PREDEFINED_SLOTS = [
  "06:00 - 08:00",
  "08:00 - 10:00",
  "14:00 - 16:00",
  "16:00 - 18:00",
  "20:00 - 22:00",
];

export default function AdminMonitorias() {
  const { dict, lang } = useI18n();
  const [monitorias, setMonitorias] = useState<Monitoria[]>([]);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirmAction, setConfirmAction] = useState<{
    type: "cancel" | "delete";
    id: string;
  } | null>(null);
  const [detailMonitoria, setDetailMonitoria] = useState<Monitoria | null>(null);
  const supabaseRef = useRef<SupabaseClient | null>(null);

  const [form, setForm] = useState({
    student_name: "",
    student_email: "",
    student_phone: "",
    semester: "",
    program: "",
    topic: "",
    description: "",
    mode: "virtual",
    scheduled_date: "",
    scheduled_time: "",
    status: "confirmed" as string,
  });

  const loadMonitorias = () => {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    const supabase = supabaseRef.current;
    supabase
      .from("monitorias")
      .select("*")
      .order("scheduled_date", { ascending: false })
      .order("scheduled_time", { ascending: false })
      .then(({ data }) => {
        if (data) setMonitorias(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadMonitorias();
  }, []);

  const updateStatus = async (id: string, newStatus: "confirmed" | "completed" | "cancelled") => {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    await supabaseRef.current.from("monitorias").update({ status: newStatus }).eq("id", id);
    if (newStatus === "confirmed") {
      const m = monitorias.find((x) => x.id === id);
      if (m) {
        fetch("/api/send-confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            student_name: m.student_name,
            student_email: m.student_email,
            topic: m.topic,
            scheduled_date: m.scheduled_date,
            scheduled_time: m.scheduled_time,
            mode: m.mode,
          }),
        });
      }
    }
    loadMonitorias();
    setConfirmAction(null);
  };

  const deleteMonitoria = async (id: string) => {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    const { error } = await supabaseRef.current.from("monitorias").delete().eq("id", id);
    if (error) {
      console.error("Error deleting monitoria:", error);
      alert(error.message);
      return;
    }
    loadMonitorias();
    setConfirmAction(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseRef.current) supabaseRef.current = createClient();
    await supabaseRef.current.from("monitorias").insert([
      {
        student_name: form.student_name,
        student_email: form.student_email,
        student_phone: form.student_phone || null,
        semester: form.semester || null,
        program: form.program || null,
        topic: form.topic || null,
        description: form.description || null,
        mode: form.mode,
        status: form.status,
        scheduled_date: form.scheduled_date,
          scheduled_time: form.scheduled_time.split(" - ")[0],
          created_by: "admin",
        },
      ]);
    setShowForm(false);
    setForm({
      student_name: "",
      student_email: "",
      student_phone: "",
      semester: "",
      program: "",
      topic: "",
      description: "",
      mode: "virtual",
      scheduled_date: "",
      scheduled_time: "",
      status: "confirmed",
    });
    loadMonitorias();
  };

  const filtered =
    filter === "all"
      ? monitorias
      : monitorias.filter((m) => m.status === filter);

  const counts: Record<string, number> = { all: monitorias.length };
  for (const s of STATUS_LIST) {
    counts[s] = monitorias.filter((m) => m.status === s).length;
  }

  const statusLabel = (s: string) => {
    switch (s) {
      case "pending": return dict.admin.pending;
      case "confirmed": return dict.admin.confirmed;
      case "completed": return dict.admin.completed;
      case "cancelled": return dict.admin.cancelled;
      default: return s;
    }
  };

  /* ────────── Confirm dialog ────────── */

  const ConfirmDialog = () => {
    if (!confirmAction) return null;
    const isCancel = confirmAction.type === "cancel";
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/40 cursor-pointer" onClick={() => setConfirmAction(null)} />
        <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full border border-border">
          <div className="text-center">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${isCancel ? "bg-red-100" : "bg-zinc-100"}`}>
              <span className="text-xl">{isCancel ? "✕" : "🗑"}</span>
            </div>
            <h3 className="text-lg font-bold mb-1">
              {isCancel ? dict.admin.seguroCancelar : dict.admin.seguroEliminar}
            </h3>
          </div>
          <div className="flex gap-2 mt-5">
            <button
              onClick={() => setConfirmAction(null)}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border font-medium text-sm hover:bg-muted transition-colors cursor-pointer"
            >
              {dict.admin.volver}
            </button>
            <button
              onClick={() =>
                isCancel
                  ? updateStatus(confirmAction.id, "cancelled")
                  : deleteMonitoria(confirmAction.id)
              }
              className={`flex-1 px-4 py-2.5 rounded-lg text-white font-medium text-sm transition-colors cursor-pointer ${isCancel ? "bg-red-500 hover:bg-red-600" : "bg-zinc-700 hover:bg-zinc-800"}`}
            >
              {isCancel ? dict.admin.accionCancelar : dict.admin.accionEliminar}
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* ────────── Detail modal ────────── */

  const DetailModal = () => {
    if (!detailMonitoria) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/40 cursor-pointer" onClick={() => setDetailMonitoria(null)} />
        <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-lg w-full border border-border max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">{dict.admin.detalle}</h3>
            <button
              onClick={() => setDetailMonitoria(null)}
              className="text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-3 gap-2">
              <span className="text-zinc-400">{dict.admin.estudiante}</span>
              <span className="col-span-2 font-medium">{detailMonitoria.student_name}</span>
              <span className="text-zinc-400">{dict.admin.email}</span>
              <span className="col-span-2 font-medium">{detailMonitoria.student_email}</span>
              {detailMonitoria.semester && (
                <>
                  <span className="text-zinc-400">{dict.admin.semestre}</span>
                  <span className="col-span-2 font-medium">{detailMonitoria.semester}</span>
                </>
              )}
              {detailMonitoria.program && (
                <>
                  <span className="text-zinc-400">{dict.admin.programa}</span>
                  <span className="col-span-2 font-medium">{detailMonitoria.program}</span>
                </>
              )}
              {detailMonitoria.topic && (
                <>
                  <span className="text-zinc-400">{dict.admin.tema}</span>
                  <span className="col-span-2 font-medium">{detailMonitoria.topic}</span>
                </>
              )}
              <span className="text-zinc-400">{dict.admin.modalidad}</span>
              <span className="col-span-2 font-medium capitalize">{detailMonitoria.mode}</span>
              <span className="text-zinc-400">{dict.admin.fecha}</span>
              <span className="col-span-2 font-medium">{detailMonitoria.scheduled_date}</span>
              <span className="text-zinc-400">{dict.admin.hora}</span>
              <span className="col-span-2 font-medium">{detailMonitoria.scheduled_time}</span>
            </div>

            {detailMonitoria.description && (
              <div className="pt-3 border-t border-border">
                <span className="text-zinc-400 text-xs uppercase tracking-wider block mb-2">{dict.admin.descripcion}</span>
                <p className="text-sm bg-zinc-50 rounded-lg p-3 whitespace-pre-wrap">{detailMonitoria.description}</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setDetailMonitoria(null)}
            className="w-full mt-5 px-4 py-2.5 rounded-lg border border-border font-medium text-sm hover:bg-muted transition-colors cursor-pointer"
          >
            {dict.admin.volver}
          </button>
        </div>
      </div>
    );
  };

  /* ────────── Stats bar ────────── */

  const STAT_STYLE: Record<string, { bg: string; border: string; activeBg: string; activeBorder: string; strip: string; icon: string }> = {
    all: {
      bg: "bg-white",
      border: "border-zinc-200",
      activeBg: "bg-zinc-100",
      activeBorder: "border-zinc-400",
      strip: "bg-zinc-400",
      icon: "📋",
    },
    pending: {
      bg: "bg-white",
      border: "border-amber-200",
      activeBg: "bg-amber-50",
      activeBorder: "border-amber-400",
      strip: "bg-amber-400",
      icon: "🕐",
    },
    confirmed: {
      bg: "bg-white",
      border: "border-green-200",
      activeBg: "bg-green-50",
      activeBorder: "border-green-500",
      strip: "bg-green-500",
      icon: "✅",
    },
    completed: {
      bg: "bg-white",
      border: "border-blue-200",
      activeBg: "bg-blue-50",
      activeBorder: "border-blue-500",
      strip: "bg-blue-500",
      icon: "✓",
    },
    cancelled: {
      bg: "bg-white",
      border: "border-red-200",
      activeBg: "bg-red-50",
      activeBorder: "border-red-400",
      strip: "bg-red-400",
      icon: "✕",
    },
  };

  const StatCard = ({ status, label, count }: { status: string; label: string; count: number }) => {
    const isActive = filter === status;
    const s = STAT_STYLE[status] || STAT_STYLE.all;
    return (
      <button
        onClick={() => setFilter(status)}
        className={`flex-1 min-w-0 flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-200 cursor-pointer
          ${isActive ? `${s.activeBg} ${s.activeBorder} shadow-sm` : `${s.bg} ${s.border} hover:shadow-sm hover:-translate-y-0.5`}`}
      >
        <div className={`w-2 h-10 rounded-full shrink-0 ${s.strip}`} />
        <div className="text-left min-w-0">
          <div className="text-xs text-zinc-500 truncate flex items-center gap-1">
            <span>{s.icon}</span>
            <span>{label}</span>
          </div>
          <div className="text-xl font-bold">{count}</div>
        </div>
      </button>
    );
  };

  /* ────────── Monitoria card ────────── */

  const MonitoriaCard = ({ m }: { m: Monitoria }) => {
    const c = STATUS_COLORS[m.status] || STATUS_COLORS.pending;
    return (
      <div className={`bg-white border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow`}>
        <div className="flex">
          <div className={`w-1.5 shrink-0 ${c.strip}`} />
          <div className="flex-1 p-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <h3 className="font-semibold text-base truncate">{m.student_name}</h3>
                <p className="text-sm text-zinc-500 truncate">{m.student_email}</p>
              </div>
              <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text} border ${c.border}`}>
                {STATUS_ICONS[m.status] && <span>{STATUS_ICONS[m.status]}</span>}
                {statusLabel(m.status)}
              </span>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5 text-sm mb-4">
              {m.topic && (
                <>
                  <span className="text-zinc-400 text-xs uppercase tracking-wider">{dict.admin.tema}</span>
                  <span className="font-medium truncate sm:col-span-3">{m.topic}</span>
                </>
              )}
              <span className="text-zinc-400 text-xs uppercase tracking-wider">{dict.admin.fecha}</span>
              <span className="font-medium">{m.scheduled_date}</span>
              <span className="text-zinc-400 text-xs uppercase tracking-wider">{dict.admin.hora}</span>
              <span className="font-medium">{m.scheduled_time}</span>
              <span className="text-zinc-400 text-xs uppercase tracking-wider">{dict.admin.modalidad}</span>
              <span className="font-medium capitalize">{m.mode}</span>
              {(m.semester || m.program) && (
                <>
                  <span className="text-zinc-400 text-xs uppercase tracking-wider">{dict.admin.semestre}</span>
                  <span className="font-medium">{m.semester || "—"} {m.program ? `/ ${m.program}` : ""}</span>
                </>
              )}
              {m.description && (
                <div className="sm:col-span-4 pt-1">
                  <button
                    onClick={() => setDetailMonitoria(m)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-red-700 transition-colors cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    {dict.admin.verMensaje}
                  </button>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
              {m.status === "pending" && (
                <>
                  <button
                    onClick={() => {
                      updateStatus(m.id, "confirmed");
                      if (m.student_phone) {
                        const fecha = formatDateNatural(m.scheduled_date);
                        const hora = formatTimeNatural(m.scheduled_time);
                        const msg = encodeURIComponent(
                          `¡Hola ${m.student_name}, acabas de reservar una monitoría! Te espero el ${fecha} a las ${hora} para tratar el tema de ${m.topic || "tu interés"}.. ¡Saludos!`
                        );
                        window.open(`https://wa.me/57${m.student_phone}?text=${msg}`, "_blank");
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {m.student_phone ? dict.admin.whatsappConfirm : dict.admin.confirmar}
                  </button>
                </>
              )}
              {m.status === "confirmed" && (
                <button
                  onClick={() => updateStatus(m.id, "completed")}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {dict.admin.completar}
                </button>
              )}
              {(m.status === "pending" || m.status === "confirmed") && (
                <button
                  onClick={() => setConfirmAction({ type: "cancel", id: m.id })}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {dict.admin.cancelar}
                </button>
              )}
              <button
                onClick={() => setConfirmAction({ type: "delete", id: m.id })}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-zinc-500 border border-transparent hover:bg-zinc-100 hover:text-red-600 transition-colors ml-auto cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {dict.admin.eliminar}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ────────── Main render ────────── */

  return (
    <>
      <ConfirmDialog />
      <DetailModal />
      <div className="max-w-6xl mx-auto px-4 py-12">

        {/* ── Hero header ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-red-700 rounded-2xl p-8 mb-8 shadow-lg">
          <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
            <svg viewBox="0 0 100 100" className="w-full h-full text-white" fill="currentColor">
              <rect x="40" y="10" width="20" height="80" rx="4" />
              <rect x="10" y="40" width="80" height="20" rx="4" />
            </svg>
          </div>
          <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
          <div className="relative flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{dict.admin.monitorias}</h1>
              </div>
              <p className="text-white/80 text-sm sm:text-base">
                {monitorias.length} {dict.admin.monitorias.toLowerCase()} registradas • {counts.pending} pendientes
              </p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="shrink-0 inline-flex items-center gap-2 bg-white text-primary px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-white/90 transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              {dict.admin.crear}
            </button>
          </div>
        </div>

        {/* ── Stats bar ── */}
        <div className="flex gap-2 mb-6 overflow-x-auto pt-1 pb-2">
          <StatCard status="all" label={dict.admin.todas} count={counts.all} />
          {STATUS_LIST.map((s) => (
            <StatCard key={s} status={s} label={statusLabel(s)} count={counts[s]} />
          ))}
        </div>

        {/* ── Create form ── */}
        {showForm && (
          <form
            onSubmit={handleCreate}
            className="bg-white border-2 border-primary/10 rounded-2xl p-6 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 shadow-lg shadow-primary/5 animate-in slide-in-from-top-2 duration-200"
          >
            <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-2 pb-2 border-b border-border mb-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="font-bold text-base">{dict.admin.crear} {dict.admin.monitorias}</span>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="ml-auto text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">
                {dict.admin.estudiante} <span className="text-primary">*</span>
              </label>
              <input
                required
                value={form.student_name}
                onChange={(e) => setForm({ ...form, student_name: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">
                {dict.admin.email} <span className="text-primary">*</span>
              </label>
              <input
                type="email"
                required
                value={form.student_email}
                onChange={(e) => setForm({ ...form, student_email: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">
                {dict.admin.telefono}
              </label>
              <input
                type="tel"
                value={form.student_phone}
                onChange={(e) => setForm({ ...form, student_phone: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">
                {dict.admin.semestre}
              </label>
              <select
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm"
              >
                <option value="">—</option>
                {["1ro", "2do", "3ro", "4to", "5to", "6to", "7mo", "8vo", "9no", "10mo"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">
                {dict.admin.programa}
              </label>
              <input
                value={form.program}
                onChange={(e) => setForm({ ...form, program: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">
                {dict.admin.tema}
              </label>
              <input
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">
                {dict.admin.modalidad} <span className="text-primary">*</span>
              </label>
              <select
                value={form.mode}
                onChange={(e) => setForm({ ...form, mode: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm"
              >
                <option value="virtual">Virtual</option>
                <option value="presencial">Presencial</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">
                {dict.admin.fecha} <span className="text-primary">*</span>
              </label>
              <input
                type="date"
                required
                value={form.scheduled_date}
                onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">
                {dict.admin.hora} <span className="text-primary">*</span>
              </label>
              <select
                required
                value={form.scheduled_time}
                onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm"
              >
                <option value="">—</option>
                {PREDEFINED_SLOTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">
                {dict.admin.estado}
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm"
              >
                <option value="confirmed">{dict.admin.confirmed}</option>
                <option value="pending">{dict.admin.pending}</option>
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-sm font-semibold mb-1.5">
                {dict.agendar.form.descripcion}
              </label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm resize-none"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex gap-3 pt-2">
              <button
                type="submit"
                className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-primary-hover transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
              >
                {dict.admin.crear}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="border-2 border-border px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors cursor-pointer"
              >
                {dict.admin.cancelar}
              </button>
            </div>
          </form>
        )}

        {/* Loading / Empty / Cards */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-border rounded-xl p-5 animate-pulse">
                <div className="h-4 bg-zinc-200 rounded w-1/3 mb-3" />
                <div className="h-3 bg-zinc-100 rounded w-1/4 mb-4" />
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div className="h-3 bg-zinc-100 rounded" />
                  <div className="h-3 bg-zinc-100 rounded" />
                  <div className="h-3 bg-zinc-100 rounded" />
                  <div className="h-3 bg-zinc-100 rounded" />
                </div>
                <div className="h-8 bg-zinc-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3 opacity-30">📋</div>
            <p className="text-zinc-400 text-lg">{dict.admin.noMonitorias}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((m) => (
              <MonitoriaCard key={m.id} m={m} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
