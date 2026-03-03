"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import type { Baby, Chapter } from "@/lib/types";
import { supabase } from "@/lib/supabase/client";
import { rowToChapter } from "@/lib/supabase/types";
import { useLang } from "@/lib/lang-context";

export default function LibroPage() {
  const router = useRouter();
  const { t, lang } = useLang();
  const [format, setFormat] = useState<"narrative" | "comic">("narrative");
  const [baby, setBaby] = useState<Baby | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chapterPhotos, setChapterPhotos] = useState<Record<string, string[]>>({});
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("fumi_baby");
    if (!stored) return;
    const babyObj: Baby = JSON.parse(stored);
    setBaby(babyObj);

    supabase
      .from("chapters")
      .select("*")
      .eq("baby_id", babyObj.id)
      .order("month")
      .then(async ({ data, error }) => {
        if (!error && data) {
          const mapped = data.map(rowToChapter);
          setChapters(mapped);

          // Fetch entry photos for each chapter
          const allEntryIds = mapped.flatMap((ch) => ch.entryIds);
          if (allEntryIds.length > 0) {
            const { data: entriesData } = await supabase
              .from("entries")
              .select("id, media_urls")
              .in("id", allEntryIds);

            if (entriesData) {
              const mediaByEntry: Record<string, string[]> = {};
              entriesData.forEach((e: { id: string; media_urls: string[] | null }) => {
                if (e.media_urls?.length) mediaByEntry[e.id] = e.media_urls;
              });

              const photos: Record<string, string[]> = {};
              mapped.forEach((ch) => {
                const urls = ch.entryIds.flatMap((eid) => mediaByEntry[eid] ?? []);
                if (urls.length > 0) photos[ch.id] = urls;
              });
              setChapterPhotos(photos);
            }
          }
        }
      });
  }, []);

  const babyName = baby?.name || "Aurora";

  const handleExport = async () => {
    if (!baby || chapters.length === 0) return;
    setExporting(true);
    setExportError("");

    try {
      const birthYear = baby.birthDate
        ? new Date(baby.birthDate).getFullYear().toString()
        : new Date().getFullYear().toString();

      const res = await fetch("/api/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          babyName,
          birthYear,
          chapters: chapters.map((ch) => ({
            month: ch.month,
            period: ch.period,
            status: ch.status,
            voice: ch.voice,
            generatedContent: ch.generatedContent,
            ownTextBlocks: ch.ownTextBlocks,
            photoUrls: chapterPhotos[ch.id] ?? [],
          })),
          lang,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setExportError(
          err.error ||
            (lang === "en" ? "Export failed." : "Error al exportar.")
        );
        return;
      }

      // Download the PDF
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${babyName.toLowerCase()}-fumi.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setExportError(
        lang === "en" ? "Export failed. Try again." : "Error al exportar. Intentá de nuevo."
      );
    } finally {
      setExporting(false);
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

  return (
    <AppShell>
      {/* Header */}
      <div className="px-6 pt-5 pb-6 flex justify-between items-start">
        <div>
          <p className="font-[family-name:var(--font-dm-sans)] text-[11px] uppercase tracking-[0.12em] text-fumi-text-muted m-0 mb-1">
            {t.book.bookOf}
          </p>
          <h1 className="font-[family-name:var(--font-playfair)] text-[34px] font-medium text-fumi-text m-0">
            {babyName}
          </h1>
          <p className="font-[family-name:var(--font-dm-sans)] text-[13px] text-fumi-text-secondary m-0 mt-1.5">
            {t.book.voiceLabel}: {babyName}
            {baby?.birthDate
              ? ` · ${t.book.since} ${new Date(baby.birthDate).toLocaleDateString("en", { month: "short", year: "numeric" })}`
              : ""}
          </p>
        </div>
      </div>

      {/* Cover preview */}
      <div
        className={`mx-6 mb-5 h-[200px] rounded-[14px] flex flex-col items-center justify-center gap-2 relative overflow-hidden transition-all duration-300 ${
          format === "comic"
            ? "bg-gradient-to-br from-[#F7F0E8] to-[#EDE4D8]"
            : "bg-gradient-to-br from-fumi-text to-[#3A3530]"
        }`}
      >
        <div
          className="absolute inset-0"
          style={{
            opacity: format === "comic" ? 0.08 : 0.06,
            background:
              format === "comic"
                ? "repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(0,0,0,0.1) 20px, rgba(0,0,0,0.1) 21px), repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(0,0,0,0.1) 20px, rgba(0,0,0,0.1) 21px)"
                : "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.5) 10px, rgba(255,255,255,0.5) 11px)",
          }}
        />
        {format === "comic" && (
          <p className="font-[family-name:var(--font-dm-sans)] text-[10px] uppercase tracking-[0.2em] text-fumi-accent m-0 relative opacity-70">
            {t.book.comic.toLowerCase()}
          </p>
        )}
        <p
          className={`font-[family-name:var(--font-playfair)] text-[34px] m-0 relative ${
            format === "comic" ? "text-fumi-text" : "text-fumi-accent-soft"
          }`}
        >
          {babyName}
        </p>
        <p
          className={`font-[family-name:var(--font-dm-sans)] text-[12px] m-0 tracking-[0.15em] uppercase relative ${
            format === "comic" ? "text-fumi-text-muted" : "text-white/40"
          }`}
        >
          {baby?.birthDate
            ? new Date(baby.birthDate).getFullYear()
            : t.book.since}
        </p>
      </div>

      {/* Format selector */}
      <div className="px-6 pb-4">
        <p className="font-[family-name:var(--font-dm-sans)] text-[11px] uppercase tracking-[0.1em] text-fumi-text-muted m-0 mb-2.5">
          {t.book.formatLabel}
        </p>
        <div className="flex gap-2.5">
          {[
            { id: "narrative" as const, label: t.book.narrative, desc: t.book.narrativeDesc },
            { id: "comic" as const, label: t.book.comic, desc: t.book.comicDesc },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFormat(f.id)}
              className={`flex-1 p-3.5 rounded-[12px] cursor-pointer text-left transition-colors ${
                format === f.id
                  ? "border-2 border-fumi-accent bg-fumi-accent/5"
                  : "border border-fumi-border bg-transparent"
              }`}
            >
              <p
                className={`font-[family-name:var(--font-dm-sans)] text-[14px] font-medium m-0 ${
                  format === f.id ? "text-fumi-accent" : "text-fumi-text"
                }`}
              >
                {f.label}
              </p>
              <p className="font-[family-name:var(--font-dm-sans)] text-[11px] text-fumi-text-muted m-0 mt-0.5">
                {f.desc}
                {f.id === "comic" && ` · ${t.book.comingSoon}`}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Chapters */}
      <div className="px-6">
        <p className="font-[family-name:var(--font-dm-sans)] text-[11px] uppercase tracking-[0.1em] text-fumi-text-muted m-0 mb-3">
          {t.book.chaptersLabel}
        </p>
        {chapters.map((ch) => {
          const status = statusMap[ch.status] ?? statusMap.collecting;

          return (
            <div
              key={ch.id}
              onClick={() => router.push(`/capitulos/${ch.id}`)}
              className="p-4 bg-white rounded-[12px] border border-fumi-border mb-2.5 flex items-center justify-between cursor-pointer hover:border-fumi-accent-soft transition-colors"
            >
              <div>
                <p className="font-[family-name:var(--font-playfair)] text-[16px] text-fumi-text m-0 font-medium">
                  {t.book.monthPrefix} {ch.month}
                </p>
                <p className="font-[family-name:var(--font-dm-sans)] text-[12px] text-fumi-text-muted m-0 mt-0.5">
                  {ch.period} · {ch.entryIds.length} {t.book.entriesSuffix}
                </p>
              </div>
              <span
                className={`font-[family-name:var(--font-dm-sans)] text-[11px] px-3 py-1 rounded-[20px] ${status.color} ${status.bg}`}
              >
                {status.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Export error */}
      {exportError && (
        <p className="px-6 font-[family-name:var(--font-dm-sans)] text-[13px] text-red-400 text-center">
          {exportError}
        </p>
      )}

      {/* Export button */}
      <div className="px-6 pt-5 pb-24">
        <button
          onClick={handleExport}
          disabled={exporting || chapters.length === 0}
          className="w-full py-4 rounded-[12px] border-none bg-fumi-text text-fumi-accent-soft font-[family-name:var(--font-dm-sans)] text-[15px] font-medium cursor-pointer disabled:opacity-50 transition-opacity"
        >
          {exporting
            ? lang === "en"
              ? "Generating PDF..."
              : "Generando PDF..."
            : t.book.exportButton}
        </button>
      </div>
    </AppShell>
  );
}
