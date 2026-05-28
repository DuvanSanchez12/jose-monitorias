"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/provider";
import type { SupabaseClient } from "@supabase/supabase-js";

type Topic = {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
};

export default function TemasPage() {
  const { dict } = useI18n();
  const supabaseRef = useRef<SupabaseClient | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabaseRef.current = supabase;
    supabase
      .from("topics")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setTopics(data);
      });
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">{dict.temas.title}</h1>
      <p className="text-zinc-500 mb-8">{dict.temas.subtitle}</p>
      {topics.length === 0 ? (
        <p className="text-zinc-400">{dict.temas.noTopics}</p>
      ) : (
        <div className="grid gap-4">
          {topics.map((topic) => (
            <div
              key={topic.id}
              className="border border-border rounded-xl p-6 hover:shadow-sm transition-shadow"
            >
              <h2 className="text-lg font-semibold mb-1">{topic.title}</h2>
              {topic.description && (
                <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                  {topic.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
