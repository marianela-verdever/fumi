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
  const [baby, setBaby] = useState<Baby | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chapterPhotos, setChapterPhotos] = useState<Record<string, string[]>>({});
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [previewPage, setPreviewPage] = useState(0); // 0 = cover, 1+ = chapters

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
  const birthYear = baby?.birthDate
    ? new Date(baby.birthDate).getFullYear().toString()
    : "";
  const monthLabel = lang === "en" ? "Month" : "Mes";

  // Exportable chapters
  const exportable = chapters.filter((ch) => ch.generatedContent.trim().length > 0);
  const totalPages = 1 + exportable.length; // cover + chapters

  const handleExport = async () => {
    if (!baby || chapters.length === 0) return;
    setExporting(true);
    setExportError("");

    try {
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

  // Get excerpt for a chapter (first ~120 chars)
  const getExcerpt = (ch: Chapter) => {
    const text = ch.generatedContent.trim();
    if (text.length <= 120) return text;
    return text.slice(0, 120).replace(/\s+\S*$/, "") + "…";
  };

  return (
    <AppShell>
      {/* Header */}
      <div className="px-6 pt-5 pb-4 flex justify-between items-start">
        <div>
          <p className="font-[family-name:var(--font-dm-sans)] text-[11px] uppercase tracking-[0.12em] text-fumi-text-muted m-0 mb-1">
            {t.book.bookOf}
          </p>
          <h1 className="font-[family-name:var(--font-playfair)] text-[34px] font-medium text-fumi-text m-0">
            {babyName}
          </h1>
          <p className="font-[family-name:var(--font-dm-sans)] text-[13px] text-fumi-text-secondary m-0 mt-1.5">
            {exportable.length} {t.book.chaptersLabel.toLowerCase()}
            {baby?.birthDate
              ? ` · ${t.book.since} ${new Date(baby.birthDate).toLocaleDateString(lang === "es" ? "es" : "en", { month: "short", year: "numeric" })}`
              : ""}
          </p>
        </div>
      </div>

      {exportable.length > 0 ? (
        <>
          {/* Book preview — interactive page flipper */}
          <div className="px-6 pb-4">
            <div className="bg-white rounded-[16px] border border-fumi-border overflow-hidden shadow-sm">
              {/* Page display */}
              <div className="relative" style={{ aspectRatio: "148 / 210" }}>
                {previewPage === 0 ? (
                  /* ── Cover page ── */
                  <div className="absolute inset-0 bg-gradient-to-br from-[#2A2520] to-[#1A1714] flex flex-col items-center justify-center gap-3 p-8">
                    {/* Decorative line pattern */}
                    <div
                      className="absolute inset-0"
                      style={{
                        opacity: 0.04,
                        background:
                          "repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.5) 8px, rgba(255,255,255,0.5) 9px)",
                      }}
                    />
                    {/* fumi. brand */}
                    <p className="font-[family-name:var(--font-playfair)] text-[13px] italic text-[#C4703F] m-0 relative">
                      fumi.
                    </p>
                    {/* Decorative dots */}
                    <div className="flex gap-1.5 my-2 relative">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-1 h-1 rounded-full"
                          style={{
                            backgroundColor: "#C4703F",
                            opacity: 0.3 + i * 0.2,
                          }}
                        />
                      ))}
                    </div>
                    {/* Baby name */}
                    <p className="font-[family-name:var(--font-playfair)] text-[28px] text-[#E8D5C4] m-0 relative text-center">
                      {babyName}
                    </p>
                    {/* Year */}
                    <p className="font-[family-name:var(--font-dm-sans)] text-[11px] tracking-[0.2em] uppercase text-white/30 m-0 relative">
                      {birthYear}
                    </p>
                    {/* Decorative line */}
                    <div className="w-8 h-[1px] bg-[#C4703F]/30 mt-3 relative" />
                  </div>
                ) : (
                  /* ── Chapter page preview ── */
                  (() => {
                    const ch = exportable[previewPage - 1];
                    if (!ch) return null;
                    const firstPhoto = chapterPhotos[ch.id]?.[0];

                    return (
                      <div className="absolute inset-0 bg-[#FAF8F5] flex flex-col p-6 overflow-hidden">
                        {/* Chapter header */}
                        <p className="font-[family-name:var(--font-playfair)] text-[18px] font-medium text-fumi-text m-0">
                          {monthLabel} {ch.month}
                        </p>
                        <p className="font-[family-name:var(--font-dm-sans)] text-[9px] uppercase tracking-[0.1em] text-fumi-text-muted m-0 mt-1">
                          {ch.period}
                        </p>

                        {/* Accent line */}
                        <div className="w-6 h-[1px] bg-fumi-accent/40 mt-3 mb-3" />

                        {/* Photo (if exists) */}
                        {firstPhoto && (
                          <div className="w-full h-[30%] rounded-[8px] overflow-hidden mb-3 flex-shrink-0">
                            <img
                              src={firstPhoto}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* Excerpt text */}
                        <p className="font-[family-name:var(--font-playfair)] text-[12px] leading-[1.7] text-fumi-text m-0 flex-1 overflow-hidden">
                          {getExcerpt(ch)}
                        </p>

                        {/* Page footer */}
                        <div className="flex justify-between items-center mt-3 pt-2 border-t border-fumi-border/50">
                          <p className="font-[family-name:var(--font-dm-sans)] text-[8px] text-fumi-text-muted m-0">
                            fumi. · {babyName}
                          </p>
                          <p className="font-[family-name:var(--font-dm-sans)] text-[8px] text-fumi-text-muted m-0">
                            {previewPage + 1}
                          </p>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>

              {/* Page navigation */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-fumi-border/50">
                <button
                  onClick={() => setPreviewPage(Math.max(0, previewPage - 1))}
                  disabled={previewPage === 0}
                  className="font-[family-name:var(--font-dm-sans)] text-[12px] text-fumi-accent cursor-pointer bg-transparent border-none disabled:opacity-30 disabled:cursor-not-allowed p-1"
                >
                  ← {lang === "en" ? "Prev" : "Ant"}
                </button>
                <p className="font-[family-name:var(--font-dm-sans)] text-[11px] text-fumi-text-muted m-0">
                  {previewPage === 0
                    ? (lang === "en" ? "Cover" : "Tapa")
                    : `${monthLabel} ${exportable[previewPage - 1]?.month ?? ""}`}
                  {" · "}
                  {previewPage + 1}/{totalPages}
                </p>
                <button
                  onClick={() => setPreviewPage(Math.min(totalPages - 1, previewPage + 1))}
                  disabled={previewPage >= totalPages - 1}
                  className="font-[family-name:var(--font-dm-sans)] text-[12px] text-fumi-accent cursor-pointer bg-transparent border-none disabled:opacity-30 disabled:cursor-not-allowed p-1"
                >
                  {lang === "en" ? "Next" : "Sig"} →
                </button>
              </div>
            </div>
          </div>

          {/* Book summary strip */}
          <div className="px-6 pb-3">
            <div className="flex gap-1.5 items-center">
              {exportable.map((ch, i) => (
                <button
                  key={ch.id}
                  onClick={() => setPreviewPage(i + 1)}
                  className={`h-1.5 rounded-full cursor-pointer border-none transition-all ${
                    previewPage === i + 1
                      ? "bg-fumi-accent w-6"
                      : "bg-fumi-border w-3 hover:bg-fumi-accent/40"
                  }`}
                />
              ))}
            </div>
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
                  disabled={f.id === "comic"}
                  className={`flex-1 p-3.5 rounded-[12px] cursor-pointer text-left transition-colors ${
                    f.id === "narrative"
                      ? "border-2 border-fumi-accent bg-fumi-accent/5"
                      : "border border-fumi-border bg-transparent opacity-50 cursor-not-allowed"
                  }`}
                >
                  <p
                    className={`font-[family-name:var(--font-dm-sans)] text-[14px] font-medium m-0 ${
                      f.id === "narrative" ? "text-fumi-accent" : "text-fumi-text"
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

          {/* Export error */}
          {exportError && (
            <p className="px-6 font-[family-name:var(--font-dm-sans)] text-[13px] text-red-400 text-center">
              {exportError}
            </p>
          )}

          {/* Export button */}
          <div className="px-6 pt-2 pb-24">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="w-full py-4 rounded-[12px] border-none bg-fumi-text text-fumi-accent-soft font-[family-name:var(--font-dm-sans)] text-[15px] font-medium cursor-pointer disabled:opacity-50 transition-opacity"
            >
              {exporting
                ? lang === "en"
                  ? "Generating PDF..."
                  : "Generando PDF..."
                : t.book.exportButton}
            </button>
          </div>
        </>
      ) : (
        /* ── Empty state ── */
        <div className="px-6 pb-24">
          <div className="flex flex-col items-center justify-center py-12">
            <div
              className="w-[80px] h-[80px] rounded-full flex items-center justify-center mb-5"
              style={{
                background:
                  "radial-gradient(circle, rgba(196,112,63,0.1) 0%, transparent 70%)",
              }}
            >
              <span className="text-[32px] text-fumi-accent/60">◻</span>
            </div>
            <h3 className="font-[family-name:var(--font-playfair)] text-[20px] font-medium text-fumi-text text-center m-0 mb-2">
              {t.emptyBook.title}
            </h3>
            <p className="font-[family-name:var(--font-dm-sans)] text-[14px] text-fumi-text-secondary text-center leading-relaxed m-0 mb-6 max-w-[280px]">
              {t.emptyBook.desc}
            </p>
            <button
              onClick={() => router.push("/capitulos")}
              className="px-6 py-3 rounded-[12px] border-none bg-fumi-accent text-white font-[family-name:var(--font-dm-sans)] text-[14px] font-medium cursor-pointer transition-all hover:opacity-90 active:scale-[0.98]"
            >
              {t.emptyBook.button}
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
