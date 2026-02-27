"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Header from "@/components/layout/Header";
import type { Chapter, Baby } from "@/lib/types";
import { supabase } from "@/lib/supabase/client";
import { rowToChapter } from "@/lib/supabase/types";
import { useLang } from "@/lib/lang-context";

export default function CapitulosPage() {
  const router = useRouter();
  const { t } = useLang();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("fumi_baby");
    if (!stored) return;
    const baby: Baby = JSON.parse(stored);

    supabase
      .from("chapters")
      .select("*")
      .eq("baby_id", baby.id)
      .order("month")
      .then(({ data, error }) => {
        if (!error && data) {
          setChapters(data.map(rowToChapter));
        }
        setIsLoading(false);
      });
  }, []);

  const statusMap = {
    approved: {
      label: t.chapters.statusApproved,
      color: "text-fumi-success",
      bg: "bg-fumi-success/10",
    },
    draft: {
      label: t.chapters.statusDraft,
      color: "text-fumi-accent",
      bg: "bg-fumi-accent/10",
    },
    collecting: {
      label: t.chapters.statusCollecting,
      color: "text-fumi-text-muted",
      bg: "bg-fumi-bg-warm",
    },
  };

  return (
    <AppShell>
      <Header title={t.chapters.title} subtitle={t.chapters.subtitle} />

      <div className="px-6 pt-2 pb-24 flex flex-col gap-3">
        {isLoading ? (
          // Skeleton
          [0, 1, 2].map((i) => (
            <div
              key={i}
              className="p-4 bg-white rounded-[12px] border border-fumi-border flex items-center justify-between"
            >
              <div>
                <div className="h-4 w-20 bg-fumi-border rounded-full mb-2" />
                <div className="h-3 w-32 bg-fumi-border rounded-full" />
              </div>
              <div className="h-6 w-20 bg-fumi-border rounded-full" />
            </div>
          ))
        ) : chapters.length === 0 ? (
          <p className="font-[family-name:var(--font-dm-sans)] text-[13px] text-fumi-text-muted text-center py-8">
            {t.chapters.statusCollecting}…
          </p>
        ) : (
          chapters.map((ch) => {
            const status = statusMap[ch.status] ?? statusMap.collecting;

            return (
              <button
                key={ch.id}
                onClick={() => router.push(`/capitulos/${ch.id}`)}
                className="p-4 bg-white rounded-[12px] border border-fumi-border flex items-center justify-between cursor-pointer text-left w-full hover:border-fumi-accent-soft transition-colors"
              >
                <div>
                  <p className="font-[family-name:var(--font-playfair)] text-[16px] text-fumi-text m-0 font-medium">
                    {t.chapters.monthPrefix} {ch.month}
                  </p>
                  <p className="font-[family-name:var(--font-dm-sans)] text-[12px] text-fumi-text-muted m-0 mt-0.5">
                    {ch.period} · {ch.entryIds.length} {t.chapters.entriesSuffix}
                  </p>
                </div>
                <span
                  className={`font-[family-name:var(--font-dm-sans)] text-[11px] px-3 py-1 rounded-[20px] ${status.color} ${status.bg}`}
                >
                  {status.label}
                </span>
              </button>
            );
          })
        )}
      </div>
    </AppShell>
  );
}
