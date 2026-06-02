"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/provider";
import type { SupabaseClient } from "@supabase/supabase-js";
import Calendar from "../components/calendar";

type Topic = {
  id: string;
  title: string;
};

type PredefinedSlot = {
  label: string;
  start: string;
  end: string;
};

type FormState = {
  student_name: string;
  student_email: string;
  student_phone: string;
  semester: string;
  program: string;
  topic: string;
  description: string;
  mode: string;
  scheduled_date: string;
  scheduled_time: string;
};

const PREDEFINED_SLOTS: PredefinedSlot[] = [
  { label: "06:00 - 08:00", start: "06:00", end: "08:00" },
  { label: "08:00 - 10:00", start: "08:00", end: "10:00" },
  { label: "14:00 - 16:00", start: "14:00", end: "16:00" },
  { label: "16:00 - 18:00", start: "16:00", end: "18:00" },
  { label: "20:00 - 22:00", start: "20:00", end: "22:00" },
];

const timeForDb = (label: string) => label.split(" - ")[0];

function generateDateRange(days: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

function formatDateFn(ds: string, lang: string) {
  if (!ds) return "";
  const d = new Date(ds + "T12:00:00");
  return d.toLocaleDateString(lang === "es" ? "es-CO" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/* ─────────────────── STEP INDICATOR ─────────────────── */

function StepIndicator({
  step,
  stepLabels,
}: {
  step: number;
  stepLabels: { label: string; desc: string }[];
}) {
  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      {stepLabels.map((s, i) => {
        const idx = i + 1;
        const isActive = idx === step;
        const isDone = idx < step;
        return (
          <div key={idx} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
                  ${isActive
                    ? "bg-primary text-white shadow-md shadow-primary/30 scale-110"
                    : isDone
                      ? "bg-primary/20 text-primary"
                      : "bg-zinc-100 text-zinc-400"
                  }`}
              >
                {isDone ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  idx
                )}
              </div>
              <span
                className={`text-sm font-medium hidden sm:inline
                  ${isActive ? "text-foreground" : isDone ? "text-primary" : "text-zinc-400"}`}
              >
                {s.label}
              </span>
            </div>
            {idx < 3 && (
              <div
                className={`w-8 h-0.5 rounded-full transition-colors duration-300
                  ${idx < step ? "bg-primary" : "bg-zinc-200"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────── STEP 1: INFO ─────────────────── */

function Step1Info({
  dict,
  form,
  setForm,
  topics,
}: {
  dict: any;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  topics: Topic[];
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">
            {dict.agendar.form.nombre} <span className="text-primary">*</span>
          </label>
          <input
            required
            value={form.student_name}
            onChange={(e) => setForm({ ...form, student_name: e.target.value })}
            placeholder={dict.agendar.form.nombrePlaceholder}
            className="w-full border border-border rounded-lg px-3 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">
            {dict.agendar.form.email} <span className="text-primary">*</span>
          </label>
          <input
            type="email"
            required
            value={form.student_email}
            onChange={(e) => setForm({ ...form, student_email: e.target.value })}
            placeholder={dict.agendar.form.emailPlaceholder}
            className="w-full border border-border rounded-lg px-3 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">
            {dict.agendar.form.phone}
          </label>
          <input
            type="tel"
            value={form.student_phone}
            onChange={(e) => setForm({ ...form, student_phone: e.target.value })}
            placeholder={dict.agendar.form.phonePlaceholder}
            className="w-full border border-border rounded-lg px-3 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">
            {dict.agendar.form.semestre}
          </label>
          <select
            value={form.semester}
            onChange={(e) => setForm({ ...form, semester: e.target.value })}
            className="w-full border border-border rounded-lg px-3 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
          >
            <option value="">{dict.agendar.form.semestrePlaceholder}</option>
            {["1ro", "2do", "3ro", "4to", "5to", "6to", "7mo", "8vo", "9no", "10mo"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">
            {dict.agendar.form.programa}
          </label>
          <input
            value={form.program}
            onChange={(e) => setForm({ ...form, program: e.target.value })}
            placeholder={dict.agendar.form.programaPlaceholder}
            className="w-full border border-border rounded-lg px-3 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
          />
        </div>
      </div>

      {topics.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-1.5">
            {dict.agendar.form.tema}
          </label>
          <select
            value={form.topic}
            onChange={(e) => setForm({ ...form, topic: e.target.value })}
            className="w-full border border-border rounded-lg px-3 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
          >
            <option value="">{dict.agendar.form.temaPlaceholder}</option>
            {topics.map((t) => (
              <option key={t.id} value={t.title}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1.5">
          {dict.agendar.form.descripcion}
        </label>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder={dict.agendar.form.descripcionPlaceholder}
          className="w-full border border-border rounded-lg px-3 py-2.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          {dict.agendar.form.modalidad} <span className="text-primary">*</span>
        </label>
        <div className="flex gap-3">
          {["virtual", "presencial"].map((mode) => (
            <label
              key={mode}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-all text-sm
                ${form.mode === mode
                  ? "border-primary bg-primary/5 text-primary font-medium"
                  : "border-border hover:border-primary/50"
                }`}
            >
              <input
                type="radio"
                name="mode"
                value={mode}
                checked={form.mode === mode}
                onChange={(e) => setForm({ ...form, mode: e.target.value })}
                className="accent-primary"
              />
              {mode === "virtual" ? dict.agendar.form.virtual : dict.agendar.form.presencial}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── STEP 2: DATE & TIME ─────────────────── */

function Step2DateTime({
  dict,
  form,
  availableDates,
  freeSlots,
  onSelectDate,
  onSelectSlot,
  lang,
}: {
  dict: any;
  form: FormState;
  availableDates: string[];
  freeSlots: PredefinedSlot[];
  onSelectDate: (date: string) => void;
  onSelectSlot: (slot: PredefinedSlot) => void;
  lang: string;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Calendar
          availableDates={availableDates}
          selectedDate={form.scheduled_date}
          onSelectDate={onSelectDate}
          monthOffset={0}
        />
        <Calendar
          availableDates={availableDates}
          selectedDate={form.scheduled_date}
          onSelectDate={onSelectDate}
          monthOffset={1}
        />
      </div>

      {form.scheduled_date && (
        <div className="bg-muted border border-border rounded-xl p-5">
          <p className="text-sm font-medium mb-1">
            {dict.agendar.form.selectedDate}:{" "}
            <span className="font-bold text-primary">{formatDateFn(form.scheduled_date, lang)}</span>
          </p>
          <p className="text-sm text-zinc-500 mb-3">{dict.agendar.form.hora}</p>
          {freeSlots.length === 0 ? (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
              {dict.agendar.form.noSlots}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {freeSlots.map((slot) => (
                <button
                  key={slot.label}
                  type="button"
                  onClick={() => onSelectSlot(slot)}
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium border transition-all duration-200
                    ${form.scheduled_time === slot.label
                      ? "bg-primary text-white border-primary shadow-md shadow-primary/30 scale-105"
                      : "border-border hover:border-primary hover:bg-primary/5 hover:shadow-sm"
                    }`}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          )}
          {form.scheduled_time && (
            <p className="text-sm text-green-600 font-medium mt-3 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {dict.agendar.form.selectedTime}: {form.scheduled_time}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────── STEP 3: CONFIRM ─────────────────── */

function Step3Confirm({
  dict,
  form,
  lang,
  onConfirm,
  loading,
}: {
  dict: any;
  form: FormState;
  lang: string;
  onConfirm: (e: React.FormEvent) => Promise<void>;
  loading: boolean;
}) {
  return (
    <div className="bg-muted border border-border rounded-xl p-6 text-sm">
      <h3 className="font-semibold text-base mb-4">{dict.agendar.summary.title}</h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
        <span className="text-zinc-500">{dict.agendar.summary.student}</span>
        <span className="font-medium">{form.student_name}</span>
        <span className="text-zinc-500">{dict.agendar.summary.email}</span>
        <span className="font-medium">{form.student_email}</span>
        {form.student_phone && (
          <>
            <span className="text-zinc-500">{dict.agendar.summary.phone}</span>
            <span className="font-medium">{form.student_phone}</span>
          </>
        )}
        {form.semester && (
          <>
            <span className="text-zinc-500">{dict.agendar.summary.semester}</span>
            <span className="font-medium">{form.semester}</span>
          </>
        )}
        {form.program && (
          <>
            <span className="text-zinc-500">{dict.agendar.summary.program}</span>
            <span className="font-medium">{form.program}</span>
          </>
        )}
        {form.topic && (
          <>
            <span className="text-zinc-500">{dict.agendar.summary.topic}</span>
            <span className="font-medium">{form.topic}</span>
          </>
        )}
        {form.description && (
          <>
            <span className="text-zinc-500">{dict.agendar.summary.message}</span>
            <span className="font-medium text-ellipsis overflow-hidden max-w-[200px]">{form.description}</span>
          </>
        )}
        <span className="text-zinc-500">{dict.agendar.summary.mode}</span>
        <span className="font-medium capitalize">{form.mode}</span>
        <span className="text-zinc-500">{dict.agendar.summary.date}</span>
        <span className="font-medium">{formatDateFn(form.scheduled_date, lang)}</span>
        <span className="text-zinc-500">{dict.agendar.summary.time}</span>
        <span className="font-medium">{form.scheduled_time}</span>
      </div>

      <button
        type="submit"
        onClick={onConfirm}
        disabled={loading}
        className="w-full mt-6 px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary-hover disabled:opacity-50 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {loading ? dict.wizard.sending : dict.wizard.confirm}
      </button>
    </div>
  );
}

/* ─────────────────── SUCCESS VIEW ─────────────────── */

function SuccessView({
  dict,
  lang,
  submittedData,
  onNewBooking,
}: {
  dict: any;
  lang: string;
  submittedData: FormState;
  onNewBooking: () => void;
}) {
  return (
    <div className="max-w-xl mx-auto px-4 py-20">
      <div className="bg-card border border-border rounded-2xl p-8 shadow-lg text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-green-600 mb-2">
          {dict.agendar.success.title}
        </h2>
        <p className="text-zinc-500 mb-6">
          {dict.agendar.success.subtitle}
        </p>

        <div className="bg-muted rounded-xl p-5 text-left space-y-2 text-sm">
          <h3 className="font-semibold text-base mb-3">{dict.agendar.success.summary}</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <span className="text-zinc-500">{dict.agendar.summary.student}</span>
            <span className="font-medium">{submittedData.student_name}</span>
            <span className="text-zinc-500">{dict.agendar.summary.email}</span>
            <span className="font-medium">{submittedData.student_email}</span>
            <span className="text-zinc-500">{dict.agendar.summary.topic}</span>
            <span className="font-medium">{submittedData.topic || "—"}</span>
            <span className="text-zinc-500">{dict.agendar.summary.mode}</span>
            <span className="font-medium capitalize">{submittedData.mode}</span>
            <span className="text-zinc-500">{dict.agendar.summary.date}</span>
            <span className="font-medium">{formatDateFn(submittedData.scheduled_date, lang)}</span>
            <span className="text-zinc-500">{dict.agendar.summary.time}</span>
            <span className="font-medium">{submittedData.scheduled_time}</span>
            <span className="text-zinc-500">{dict.agendar.summary.status}</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>{dict.agendar.summary.pending}</span>
            </span>
          </div>
        </div>

        <div className="flex gap-3 justify-center mt-6">
          <button
            onClick={onNewBooking}
            className="px-5 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover transition-colors"
          >
            {dict.agendar.success.newBooking}
          </button>
          <a
            href="/"
            className="px-5 py-2.5 rounded-lg border border-border font-medium hover:bg-muted transition-colors"
          >
            {dict.agendar.success.goHome}
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── MAIN PAGE ─────────────────── */

export default function AgendarPage() {
  const { dict, lang } = useI18n();
  const supabaseRef = useRef<SupabaseClient | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [freeSlots, setFreeSlots] = useState<PredefinedSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [submittedData, setSubmittedData] = useState<FormState | null>(null);

  const [form, setForm] = useState<FormState>({
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
  });

  const [availableDates, setAvailableDates] = useState<string[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabaseRef.current = supabase;
    const allDates = generateDateRange(90);
    Promise.all([
      supabase.from("topics").select("id, title").eq("is_active", true),
      supabase.from("availability_days").select("date").eq("is_available", true),
    ]).then(([topicsResult, availResult]) => {
      if (topicsResult.data) setTopics(topicsResult.data);
      const availSet = new Set(
        (availResult.data || []).map((r: any) => r.date)
      );
      setAvailableDates(allDates.filter((d) => availSet.has(d)));
    });
  }, []);

  const handleSelectDate = async (date: string) => {
    setForm({ ...form, scheduled_date: date, scheduled_time: "" });
    setFreeSlots([]);

    const supabase = supabaseRef.current;
    if (!supabase) return;

    const { data: booked } = await supabase
      .from("monitorias")
      .select("scheduled_time")
      .eq("scheduled_date", date)
      .neq("status", "cancelled");

    const bookedStarts = new Set(
      (booked || []).map((b: any) => b.scheduled_time.substring(0, 5))
    );

    const available = PREDEFINED_SLOTS.filter(
      (slot) => !bookedStarts.has(slot.start)
    );
    setFreeSlots(available);
  };

  const selectSlot = (slot: PredefinedSlot) => {
    setForm({ ...form, scheduled_time: slot.label });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = supabaseRef.current;
    if (!supabase) return;
    setLoading(true);
    setError("");

    if (!form.scheduled_date || !form.scheduled_time) {
      setError("Selecciona una fecha y hora disponible");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("monitorias")
      .insert([
        {
          student_name: form.student_name,
          student_email: form.student_email,
          student_phone: form.student_phone || null,
          semester: form.semester || null,
          program: form.program || null,
          topic: form.topic || null,
          description: form.description || null,
          mode: form.mode,
          status: "pending",
          scheduled_date: form.scheduled_date,
          scheduled_time: timeForDb(form.scheduled_time),
          created_by: "student",
        },
      ]);

    if (insertError) {
      if (insertError.code !== "23505") {
        setError(dict.agendar.error);
      }
      const { data: booked } = await supabase
        .from("monitorias")
        .select("scheduled_time")
        .eq("scheduled_date", form.scheduled_date)
        .neq("status", "cancelled");
      const bookedStarts = new Set(
        (booked || []).map((b: any) => b.scheduled_time.substring(0, 5))
      );
      setFreeSlots(
        PREDEFINED_SLOTS.filter((slot) => !bookedStarts.has(slot.start))
      );
      setForm({ ...form, scheduled_time: "" });
      setLoading(false);
      return;
    }

    fetch("/api/send-notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_name: form.student_name,
        student_email: form.student_email,
        topic: form.topic,
        scheduled_date: form.scheduled_date,
        scheduled_time: form.scheduled_time,
        mode: form.mode,
      }),
    }).catch(() => {});

    setSubmittedData({ ...form });
    setSuccess(true);
    setLoading(false);
  };

  const canGoStep1 = form.student_name.trim() && form.student_email.trim();
  const canGoStep2 = form.scheduled_date && form.scheduled_time;

  const stepLabels = [
    { label: dict.wizard.info, desc: dict.wizard.infoDesc },
    { label: dict.wizard.date, desc: dict.wizard.dateDesc },
    { label: dict.wizard.confirm, desc: dict.wizard.confirmDesc },
  ];

  const handleNewBooking = () => {
    setSuccess(false);
    setStep(1);
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
    });
    setFreeSlots([]);
    setSubmittedData(null);
  };

  if (success && submittedData) {
    return (
      <SuccessView
        dict={dict}
        lang={lang}
        submittedData={submittedData}
        onNewBooking={handleNewBooking}
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-2">
        <h1 className="text-3xl font-bold">{dict.agendar.title}</h1>
        <p className="text-zinc-500 mt-1">{dict.agendar.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8">
        <StepIndicator step={step} stepLabels={stepLabels} />

        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="mb-6">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              {dict.wizard.step} {step} {dict.wizard.of} 3
            </span>
            <h2 className="text-xl font-bold mt-1">{stepLabels[step - 1].label}</h2>
            <p className="text-sm text-zinc-500">{stepLabels[step - 1].desc}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          {step === 1 && (
            <Step1Info
              dict={dict}
              form={form}
              setForm={setForm}
              topics={topics}
            />
          )}
          {step === 2 && (
            <Step2DateTime
              dict={dict}
              form={form}
              lang={lang}
              availableDates={availableDates}
              freeSlots={freeSlots}
              onSelectDate={handleSelectDate}
              onSelectSlot={selectSlot}
            />
          )}
          {step === 3 && (
            <Step3Confirm dict={dict} form={form} lang={lang} onConfirm={handleSubmit} loading={loading} />
          )}

          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-5 py-2.5 rounded-lg border border-border font-medium hover:bg-muted transition-colors text-sm cursor-pointer"
              >
                ← {dict.wizard.back}
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                disabled={step === 1 ? !canGoStep1 : !canGoStep2}
                onClick={() => setStep(step + 1)}
                className="px-6 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm cursor-pointer"
              >
                {dict.wizard.next} →
              </button>
            ) : (
              <div />
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
