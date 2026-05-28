"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/provider";
import type { SupabaseClient } from "@supabase/supabase-js";

type Topic = {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
};

export default function AdminTemas() {
  const { dict } = useI18n();
  const supabaseRef = useRef<SupabaseClient | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "" });

  const loadTopics = () => {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    const supabase = supabaseRef.current;
    supabase
      .from("topics")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setTopics(data);
      });
  };

  useEffect(() => {
    loadTopics();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseRef.current) supabaseRef.current = createClient();
    await supabaseRef.current.from("topics").insert([
      {
        title: form.title,
        description: form.description || null,
      },
    ]);
    setShowForm(false);
    setForm({ title: "", description: "" });
    loadTopics();
  };

  const toggleActive = async (id: string, is_active: boolean) => {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    await supabaseRef.current
      .from("topics")
      .update({ is_active: !is_active })
      .eq("id", id);
    loadTopics();
  };

  const deleteTopic = async (id: string) => {
    if (!supabaseRef.current) supabaseRef.current = createClient();
    await supabaseRef.current.from("topics").delete().eq("id", id);
    loadTopics();
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">{dict.admin.temas}</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
        >
          {dict.admin.agregarTema}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="border border-border rounded-xl p-6 mb-8 flex flex-col gap-4"
        >
          <div>
            <label className="block text-sm font-medium mb-1">
              {dict.admin.titulo} *
            </label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border border-border rounded-lg px-3 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {dict.admin.descripcion}
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full border border-border rounded-lg px-3 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors"
            >
              {dict.admin.crear}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="border border-border px-4 py-2 rounded-lg text-sm hover:bg-muted transition-colors"
            >
              {dict.admin.cancelar}
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4">
        {topics.map((topic) => (
          <div
            key={topic.id}
            className={`border border-border rounded-xl p-6 ${!topic.is_active ? "opacity-50" : ""}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{topic.title}</h3>
                {topic.description && (
                  <p className="text-sm text-zinc-500 mt-1">
                    {topic.description}
                  </p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => toggleActive(topic.id, topic.is_active)}
                  className={`text-xs font-medium ${topic.is_active ? "text-red-500" : "text-green-500"}`}
                >
                  {topic.is_active
                    ? dict.admin.inactivo
                    : dict.admin.activo}
                </button>
                <button
                  onClick={() => deleteTopic(topic.id)}
                  className="text-xs text-zinc-400 hover:text-red-500"
                >
                  {dict.admin.eliminar}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
