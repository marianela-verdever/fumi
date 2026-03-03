"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Header from "@/components/layout/Header";
import type { Chapter, Baby, Entry } from "@/lib/types";
import { supabase } from "@/lib/supabase/client";
import { rowToChapter, rowToEntry } from "@/lib/supabase/types";
import { useLang } from "@/lib/lang-context";
import { getTotalMonths, getMonthNumber, getMonthPeriod, getYearPeriod } from "@/lib/utils";

export default function CapitulosPage() {
  const router = useRouter();
  const { t, lang } = useLang();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [baby, setBaby] = useState<Baby | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [creatingMonth, setCreatingMonth] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("fumi_baby");
    if (!stored) return;
    const babyObj: Baby = JSON.parse(stored);
    setBaby(babyObj);

    // Fetch chapters + entries in parallel
    Promise.all([
      supabase
        .from("chapters")
        .select("*")
        .eq("baby_id", babyObj.id)
        .order("month"),
      supabase
        .from("entries")
        .select("*")
        .eq("baby_id", babyObj.id)
        .order("date", { ascending: false }),
    ]).then(([chaptersRes, entriesRes]) => {
      if (!chaptersRes.error && chaptersRes.data) {
        setChapters(chaptersRes.data.map(rowToChapter));
      }
      if (!entriesRes.error && entriesRes.data) {
        setEntries(entriesRes.data.map(rowToEntry));
      }
      setIsLoading(false);
    });
  }, []);

  const handleCreateChapter = async (month: number) => {
    if (!baby || creatingMonth !== null) return;
    setCreatingMonth(month);

    const monthEntries = entries.filter(
      (e) => getMonthNumber(e.date, baby.birthDate) === month
    );

    try {
      // Call the generate API
      const res = await fetch("/api/chapters/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: monthEntries.map((e) => ({
            date: e.date,
            content: e.content,
            type: e.type,
            tags: e.tags,
          })),
          voice: "baby",
          month,
          babyName: baby.name,
          lang,
        }),
      });
      const data = await res.json();

      // Insert chapter into Supabase
      const { data: chapterData, error } = await supabase
        .from("chapters")
        .insert({
          baby_id: baby.id,
          month,
          period: getMonthPeriod(month, baby.birthDate),
          status: monthEntries.length > 0 ? "draft" : "collecting",
          voice: "baby",
          generated_content: data.content,
          own_text_blocks: [],
          entry_ids: monthEntries.map((e) => e.id),
        })
        .select()
        .single();

      if (!error && chapterData) {
        router.push(`/capitulos/${chapterData.id}`);
      }
    } catch {
      console.error("Failed to create chapter");
    } finally {
      setCreatingMonth(null);
    }
  };

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

  // Build month slots
  const totalMonths = baby ? getTotalMonths(baby.birthDate) : 0;

  // Group entries by month
  const entriesByMonth: Record<number, Entry[]> = {};
  if (baby) {
    entries.forEach((entry) => {
      const m = getMonthNumber(entry.date, baby.birthDate);
      if (!entriesByMonth[m]) entriesByMonth[m] = [];
      entriesByMonth[m].push(entry);
    });
  }

  // Map chapters by month for quick lookup
  const chapterByMonth: Record<number, Chapter> = {};
  chapters.forEach((ch) => {
    chapterByMonth[ch.month] = ch;
  });

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
        ) : totalMonths === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div
              className="w-[80px] h-[80px] rounded-full flex items-center justify-center mb-5"
              style={{
                background:
                  "radial-gradient(circle, rgba(196,112,63,0.1) 0%, transparent 70%)",
              }}
            >
              <span className="text-[32px] text-fumi-accent/60">◬</span>
            </div>
            <h3 className="font-[family-name:var(--font-playfair)] text-[20px] font-medium text-fumi-text text-center m-0 mb-2">
              {t.emptyChapters.title}
            </h3>
            <p className="font-[family-name:var(--font-dm-sans)] text-[14px] text-fumi-text-secondary text-center leading-relaxed m-0 mb-6 max-w-[280px]">
              {t.emptyChapters.desc}
            </p>
            <button
              onClick={() => router.push("/agregar")}
              className="px-6 py-3 rounded-[12px] border-none bg-fumi-accent text-white font-[family-name:var(--font-dm-sans)] text-[14px] font-medium cursor-pointer transition-all hover:opacity-90 active:scale-[0.98]"
            >
              {t.emptyChapters.button}
            </button>
          </div>
        ) : (
          (() => {
            const totalYears = Math.ceil(totalMonths / 12);
            const singleYear = totalYears === 1;

            return Array.from({ length: totalYears }, (_, yi) => yi + 1).map((year) => {
              const firstMonth = (year - 1) * 12 + 1;
              const lastMonth = Math.min(year * 12, totalMonths);
              const months = Array.from(
                { length: lastMonth - firstMonth + 1 },
                (_, i) => firstMonth + i
              );
              const isCurrentYear = year === totalYears;
              const yearPeriod = baby ? getYearPeriod(year, baby.birthDate, totalMonths) : "";

              const yearContent = months.map((month) => {
                const chapter = chapterByMonth[month];
                const monthEntries = entriesByMonth[month] ?? [];
                const entryCount = monthEntries.length;

                // State 1: Has chapter — clickable card to editor
                if (chapter) {
                  const status = statusMap[chapter.status] ?? statusMap.collecting;
                  const newCount = entryCount - chapter.entryIds.length;
                  return (
                    <button
                      key={month}
                      onClick={() => router.push(`/capitulos/${chapter.id}`)}
                      className="p-4 bg-white rounded-[12px] border border-fumi-border flex items-center justify-between cursor-pointer text-left w-full hover:border-fumi-accent-soft transition-colors"
                    >
                      <div>
                        <p className="font-[family-name:var(--font-playfair)] text-[16px] text-fumi-text m-0 font-medium">
                          {t.chapters.monthPrefix} {month}
                        </p>
                        <p className="font-[family-name:var(--font-dm-sans)] text-[12px] text-fumi-text-muted m-0 mt-0.5">
                          {chapter.period} · {chapter.entryIds.length}{" "}
                          {t.chapters.entriesSuffix}
                          {newCount > 0 && (
                            <span className="text-fumi-accent font-medium">
                              {" "}
                              · +{newCount} {t.chapters.newEntries}
                            </span>
                          )}
                        </p>
                      </div>
                      <span
                        className={`font-[family-name:var(--font-dm-sans)] text-[11px] px-3 py-1 rounded-[20px] ${status.color} ${status.bg}`}
                      >
                        {status.label}
                      </span>
                    </button>
                  );
                }

                // State 2: Has entries but no chapter — "Create chapter" button
                if (entryCount > 0) {
                  return (
                    <div
                      key={month}
                      className="p-4 bg-white rounded-[12px] border border-fumi-border flex items-center justify-between"
                    >
                      <div>
                        <p className="font-[family-name:var(--font-playfair)] text-[16px] text-fumi-text m-0 font-medium">
                          {t.chapters.monthPrefix} {month}
                        </p>
                        <p className="font-[family-name:var(--font-dm-sans)] text-[12px] text-fumi-text-muted m-0 mt-0.5">
                          {entryCount} {t.chapters.entriesReady}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCreateChapter(month)}
                        disabled={creatingMonth !== null}
                        className="font-[family-name:var(--font-dm-sans)] text-[12px] px-3.5 py-1.5 rounded-[20px] bg-fumi-accent text-white border-none cursor-pointer disabled:opacity-50 transition-opacity"
                      >
                        {creatingMonth === month
                          ? t.chapters.generating
                          : t.chapters.createChapter}
                      </button>
                    </div>
                  );
                }

                // State 3: No entries, no chapter — dimmed
                return (
                  <div
                    key={month}
                    className="p-4 bg-fumi-bg-warm rounded-[12px] border border-fumi-border/50 flex items-center justify-between opacity-60"
                  >
                    <div>
                      <p className="font-[family-name:var(--font-playfair)] text-[16px] text-fumi-text-muted m-0 font-medium">
                        {t.chapters.monthPrefix} {month}
                      </p>
                      <p className="font-[family-name:var(--font-dm-sans)] text-[12px] text-fumi-text-muted m-0 mt-0.5">
                        {t.chapters.noEntriesYet}
                      </p>
                    </div>
                  </div>
                );
              });

              // Single year: no grouping needed, just render the months
              if (singleYear) {
                return <div key={year} className="flex flex-col gap-3">{yearContent}</div>;
              }

              // Multiple years: collapsible sections
              return (
                <details key={year} open={isCurrentYear} className="group">
                  <summary className="flex items-center gap-2 cursor-pointer list-none py-2 mb-1 [&::-webkit-details-marker]:hidden">
                    <span className="text-[11px] text-fumi-text-muted transition-transform group-open:rotate-90">▶</span>
                    <span className="font-[family-name:var(--font-playfair)] text-[14px] text-fumi-text font-medium">
                      {t.chapters.yearPrefix} {year}
                    </span>
                    <span className="font-[family-name:var(--font-dm-sans)] text-[11px] text-fumi-text-muted">
                      {yearPeriod}
                    </span>
                  </summary>
                  <div className="flex flex-col gap-3 pb-2">{yearContent}</div>
                </details>
              );
            });
          })()
        )}
      </div>
    </AppShell>
  );
}
