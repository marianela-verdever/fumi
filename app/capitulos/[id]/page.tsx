"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Header from "@/components/layout/Header";
import type { Voice, Chapter } from "@/lib/types";
import { supabase } from "@/lib/supabase/client";
import { rowToChapter } from "@/lib/supabase/types";
import { useLang } from "@/lib/lang-context";
import type { Lang } from "@/lib/i18n";
import ShareCardModal from "@/components/ShareCardModal";

interface OwnBlock {
  id: string;
  text: string;
  afterParagraph: number;
}

function suggestPlacement(
  text: string,
  paragraphs: string[],
  lang: Lang
): { index: number; reason: string } {
  const lower = text.toLowerCase();

  const reasons =
    lang === "en"
      ? {
          christmas: "the paragraph about Christmas Eve",
          firstWords: "the paragraph about her first sounds",
          closing: "the end of the chapter, as a closing",
          default: "the end of the chapter",
        }
      : {
          christmas: "el párrafo sobre Nochebuena",
          firstWords: "el párrafo sobre sus primeras palabras",
          closing: "al final del capítulo, como cierre",
          default: "al final del capítulo",
        };

  if (lower.includes("noche") || lower.includes("navidad") || lower.includes("año nuevo")) {
    return { index: 0, reason: reasons.christmas };
  }
  if (lower.includes("voz") || lower.includes("eglu") || lower.includes("boca abajo")) {
    return { index: Math.min(2, paragraphs.length - 1), reason: reasons.firstWords };
  }
  if (lower.includes("café") || lower.includes("dana") || lower.includes("salir")) {
    return { index: paragraphs.length - 1, reason: reasons.closing };
  }
  return { index: paragraphs.length - 1, reason: reasons.default };
}

export default function ChapterEditorPage() {
  const params = useParams();
  const chapterId = params.id as string;
  const { t, lang } = useLang();
  const ce = t.chapterEditor;

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [voice, setVoice] = useState<Voice>("baby");
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState("");
  const [showRegenInput, setShowRegenInput] = useState(false);
  const [regenInstruction, setRegenInstruction] = useState("");

  const [ownBlocks, setOwnBlocks] = useState<OwnBlock[]>([]);
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [newBlockText, setNewBlockText] = useState("");
  const [insertAtIndex, setInsertAtIndex] = useState<number | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<{
    index: number;
    reason: string;
  } | null>(null);
  const [showNudge, setShowNudge] = useState(false);

  const [babyName, setBabyName] = useState("Aurora");
  const [approved, setApproved] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [actionError, setActionError] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [entryPhotos, setEntryPhotos] = useState<string[]>([]);

  // Load chapter from Supabase
  useEffect(() => {
    const stored = localStorage.getItem("fumi_baby");
    if (stored) {
      const baby = JSON.parse(stored);
      setBabyName(baby.name);
    }

    supabase
      .from("chapters")
      .select("*")
      .eq("id", chapterId)
      .single()
      .then(async ({ data, error }) => {
        if (error || !data) {
          setNotFound(true);
        } else {
          const ch = rowToChapter(data);
          setChapter(ch);
          setVoice(ch.voice);
          setContent(ch.generatedContent);
          setOwnBlocks((ch.ownTextBlocks ?? []) as unknown as OwnBlock[]);
          setApproved(ch.status === "approved");

          // Fetch photos from linked entries
          if (ch.entryIds.length > 0) {
            const { data: entries } = await supabase
              .from("entries")
              .select("media_urls")
              .in("id", ch.entryIds);
            if (entries) {
              const photos = entries
                .flatMap((e: { media_urls: string[] | null }) => e.media_urls ?? [])
                .filter((url: string) => url);
              setEntryPhotos(photos);
            }
          }
        }
        setIsLoading(false);
      });
  }, [chapterId]);

  // Auto-save helpers
  const saveVoice = useCallback(
    async (v: Voice) => {
      await supabase.from("chapters").update({ voice: v }).eq("id", chapterId);
    },
    [chapterId]
  );

  const saveContent = useCallback(
    async (c: string) => {
      await supabase
        .from("chapters")
        .update({ generated_content: c })
        .eq("id", chapterId);
    },
    [chapterId]
  );

  const saveOwnBlocks = useCallback(
    async (blocks: OwnBlock[]) => {
      await supabase
        .from("chapters")
        .update({ own_text_blocks: blocks })
        .eq("id", chapterId);
    },
    [chapterId]
  );

  const handleApprove = async () => {
    const { error } = await supabase
      .from("chapters")
      .update({ status: "approved" })
      .eq("id", chapterId);
    if (!error) {
      setApproved(true);
      setChapter((prev) => (prev ? { ...prev, status: "approved" } : prev));
    }
  };

  const voices: { id: Voice; label: string }[] = [
    { id: "yo", label: ce.voiceI },
    { id: "nosotros", label: ce.voiceWe },
    { id: "baby", label: babyName },
  ];

  const paragraphs = content.split("\n\n").filter((p) => p.trim());

  const handleVoiceChange = (v: Voice) => {
    setVoice(v);
    setEditing(false);
    setShowRegenInput(false);
    saveVoice(v);
  };

  const handlePreviewToggle = () => {
    if (editing) {
      // switching edit → preview: persist content
      saveContent(content);
    }
    setEditing(!editing);
    setShowRegenInput(false);
  };

  const handleRegenerate = async () => {
    if (!regenInstruction.trim()) return;
    setIsRegenerating(true);
    setActionError("");

    try {
      const res = await fetch("/api/chapters/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: [],
          voice,
          month: chapter!.month,
          babyName,
          instruction: regenInstruction.trim(),
          currentContent: content,
          lang,
        }),
      });

      if (!res.ok) {
        setActionError(lang === "es" ? "Error al regenerar. Intentá de nuevo." : "Regeneration failed. Try again.");
        return;
      }

      const data = await res.json();
      if (data.content && data.content.length > 50) {
        setContent(data.content);
        saveContent(data.content);
      } else {
        setActionError(lang === "es" ? "Error al regenerar. Intentá de nuevo." : "Regeneration failed. Try again.");
      }
    } catch {
      setActionError(lang === "es" ? "Error al regenerar. Intentá de nuevo." : "Regeneration failed. Try again.");
    } finally {
      setIsRegenerating(false);
      setRegenInstruction("");
      setShowRegenInput(false);
    }
  };

  const handleNewBlockTextChange = (text: string) => {
    setNewBlockText(text);
    if (text.trim().length > 15) {
      const suggestion = suggestPlacement(text, paragraphs, lang);
      setAiSuggestion(suggestion);
      if (insertAtIndex === null) {
        setInsertAtIndex(suggestion.index);
        setShowNudge(false);
      }
    } else {
      setAiSuggestion(null);
      setShowNudge(false);
    }
  };

  const handleSaveBlock = () => {
    if (!newBlockText.trim()) return;
    const targetIndex = insertAtIndex ?? paragraphs.length - 1;
    const newBlock: OwnBlock = {
      id: crypto.randomUUID(),
      text: newBlockText.trim(),
      afterParagraph: targetIndex,
    };
    const updated = [...ownBlocks, newBlock];
    setOwnBlocks(updated);
    saveOwnBlocks(updated);
    setNewBlockText("");
    setInsertAtIndex(null);
    setAiSuggestion(null);
    setShowNudge(false);
    setShowAddBlock(false);
  };

  const handleNudge = (direction: "up" | "down") => {
    if (insertAtIndex === null) return;
    const next =
      direction === "up"
        ? Math.max(0, insertAtIndex - 1)
        : Math.min(paragraphs.length - 1, insertAtIndex + 1);
    setInsertAtIndex(next);
  };

  const handleMoveBlock = (blockId: string, direction: "up" | "down") => {
    const updated = ownBlocks.map((b) => {
      if (b.id !== blockId) return b;
      const newPos =
        direction === "up"
          ? Math.max(0, b.afterParagraph - 1)
          : Math.min(paragraphs.length - 1, b.afterParagraph + 1);
      return { ...b, afterParagraph: newPos };
    });
    setOwnBlocks(updated);
    saveOwnBlocks(updated);
  };

  const handleRemoveBlock = (blockId: string) => {
    const updated = ownBlocks.filter((b) => b.id !== blockId);
    setOwnBlocks(updated);
    saveOwnBlocks(updated);
  };

  // Detect if chapter content language differs from app language
  const detectContentLang = (text: string): Lang | null => {
    if (!text || text.length < 30) return null;
    const sample = text.toLowerCase().slice(0, 500);
    // Spanish markers
    const esWords = ["que ", " de ", " los ", " las ", " del ", " una ", " con ", " para ", " por ", " fue ", " como ", " pero ", " cuando ", " había ", " este "];
    // English markers
    const enWords = ["the ", " and ", " was ", " with ", " that ", " for ", " his ", " her ", " from ", " they ", " were ", " have ", " this ", " been ", " when "];
    const esScore = esWords.filter((w) => sample.includes(w)).length;
    const enScore = enWords.filter((w) => sample.includes(w)).length;
    if (esScore > enScore + 2) return "es";
    if (enScore > esScore + 2) return "en";
    return null;
  };

  const contentLang = detectContentLang(content);
  const showTranslateBanner = contentLang !== null && contentLang !== lang && content.length > 30;

  const handleTranslate = async () => {
    setIsTranslating(true);
    setActionError("");
    const instruction = lang === "en"
      ? `Translate this entire chapter to English. Keep the same literary tone, voice, and style. Do not add or remove content — just translate accurately.`
      : `Traducí este capítulo completo a español. Mantené el mismo tono literario, voz y estilo. No agregues ni elimines contenido — solo traducí fielmente. Usa español neutro con "tú".`;

    try {
      const res = await fetch("/api/chapters/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: [],
          voice,
          month: chapter!.month,
          babyName,
          instruction,
          currentContent: content,
          lang,
        }),
      });

      if (!res.ok) {
        setActionError(lang === "es" ? "Error al traducir. Intentá de nuevo." : "Translation failed. Try again.");
        return;
      }

      const data = await res.json();
      if (data.content && data.content.length > 50) {
        setContent(data.content);
        saveContent(data.content);
      } else {
        setActionError(lang === "es" ? "Error al traducir. Intentá de nuevo." : "Translation failed. Try again.");
      }
    } catch {
      setActionError(lang === "es" ? "Error al traducir. Intentá de nuevo." : "Translation failed. Try again.");
    } finally {
      setIsTranslating(false);
    }
  };

  // Distribute photos across paragraphs evenly
  const photosByParagraph: Record<number, string[]> = {};
  if (entryPhotos.length > 0 && paragraphs.length > 0) {
    const interval = Math.max(1, Math.floor(paragraphs.length / Math.min(entryPhotos.length, paragraphs.length)));
    entryPhotos.forEach((url, i) => {
      const afterIdx = Math.min(interval * i + (interval - 1), paragraphs.length - 1);
      if (!photosByParagraph[afterIdx]) photosByParagraph[afterIdx] = [];
      photosByParagraph[afterIdx].push(url);
    });
  }

  const renderChapterContent = () => {
    const elements: React.ReactNode[] = [];

    paragraphs.forEach((p, i) => {
      elements.push(
        <p
          key={`p-${voice}-${i}`}
          className={`font-[family-name:var(--font-playfair)] text-[15px] text-fumi-text leading-[1.75] ${
            i === 0 ? "m-0" : "mt-4 mb-0"
          }`}
        >
          {p}
        </p>
      );

      {/* Entry photos after this paragraph */}
      {const photos = photosByParagraph[i];
      if (photos && photos.length > 0) {
        elements.push(
          <div
            key={`photos-${i}`}
            className={`mt-4 flex gap-2 overflow-x-auto ${photos.length === 1 ? "" : "pb-1"}`}
          >
            {photos.map((url, pi) => (
              <img
                key={`photo-${i}-${pi}`}
                src={url}
                alt=""
                className={`rounded-[10px] object-cover ${
                  photos.length === 1
                    ? "w-full h-48"
                    : "w-40 h-40 shrink-0"
                }`}
              />
            ))}
          </div>
        );
      }}

      const blocksHere = ownBlocks.filter((b) => b.afterParagraph === i);
      blocksHere.forEach((block) =>
        elements.push(
          <div
            key={`own-${block.id}`}
            className="mt-4 p-4 bg-white rounded-[12px] border-[1.5px] border-fumi-accent-soft relative"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-fumi-accent" />
                <span className="font-[family-name:var(--font-dm-sans)] text-[10px] uppercase tracking-[0.08em] text-fumi-accent">
                  {ce.ownTextLabel}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleMoveBlock(block.id, "up")}
                  className="w-6 h-6 rounded-full border border-fumi-border bg-transparent text-fumi-text-muted text-[11px] cursor-pointer flex items-center justify-center hover:border-fumi-accent hover:text-fumi-accent transition-colors"
                  title={ce.moveUp}
                >
                  ↑
                </button>
                <button
                  onClick={() => handleMoveBlock(block.id, "down")}
                  className="w-6 h-6 rounded-full border border-fumi-border bg-transparent text-fumi-text-muted text-[11px] cursor-pointer flex items-center justify-center hover:border-fumi-accent hover:text-fumi-accent transition-colors"
                  title={ce.moveDown}
                >
                  ↓
                </button>
                <button
                  onClick={() => handleRemoveBlock(block.id)}
                  className="w-6 h-6 rounded-full border border-fumi-border bg-transparent text-fumi-text-muted text-[11px] cursor-pointer flex items-center justify-center hover:border-red-400 hover:text-red-400 transition-colors ml-1"
                  title={ce.remove}
                >
                  ×
                </button>
              </div>
            </div>
            <p className="font-[family-name:var(--font-playfair)] text-[15px] text-fumi-text leading-[1.75] italic m-0">
              {block.text}
            </p>
          </div>
        )
      );

      if (showAddBlock && insertAtIndex === i) {
        elements.push(
          <div
            key={`insert-${i}`}
            className="mt-4 border-2 border-dashed border-fumi-accent rounded-[12px] p-3 flex items-center justify-center"
          >
            <span className="font-[family-name:var(--font-dm-sans)] text-[12px] text-fumi-accent">
              {ce.insertHere}
            </span>
          </div>
        );
      }
    });

    return elements;
  };

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <AppShell>
        <div className="px-6 pt-5 pb-24 flex flex-col gap-4">
          <div className="h-7 w-32 bg-fumi-border rounded-full" />
          <div className="h-4 w-48 bg-fumi-border rounded-full" />
          <div className="flex gap-2 mt-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-9 w-20 bg-fumi-border rounded-full" />
            ))}
          </div>
          <div className="mt-2 p-5 bg-white rounded-[14px] border border-fumi-border flex flex-col gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-4 bg-fumi-border rounded-full ${
                  i === 3 ? "w-2/3" : "w-full"
                }`}
              />
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  // ── Not found ────────────────────────────────────────────────────────────
  if (notFound || !chapter) {
    return (
      <AppShell>
        <div className="px-6 pt-12 flex flex-col items-center">
          <p className="font-[family-name:var(--font-playfair)] text-[18px] text-fumi-text-muted text-center italic">
            {lang === "en" ? "Chapter not found." : "Capítulo no encontrado."}
          </p>
        </div>
      </AppShell>
    );
  }

  // ── Editor ───────────────────────────────────────────────────────────────
  return (
    <AppShell>
      <Header
        title={`${ce.monthPrefix} ${chapter.month}`}
        subtitle={chapter.period}
      />

      {/* Voice selector */}
      <div className="px-6 pt-2 pb-4">
        <p className="font-[family-name:var(--font-dm-sans)] text-[11px] uppercase tracking-[0.1em] text-fumi-text-muted m-0 mb-2">
          {ce.voiceLabel}
        </p>
        <div className="flex gap-2">
          {voices.map((v) => (
            <button
              key={v.id}
              onClick={() => handleVoiceChange(v.id)}
              className={`px-[18px] py-2 rounded-[20px] font-[family-name:var(--font-dm-sans)] text-[13px] cursor-pointer transition-all ${
                voice === v.id
                  ? "border-none bg-fumi-accent text-white font-medium"
                  : "border border-fumi-border bg-transparent text-fumi-text-secondary"
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Status indicator */}
      {chapter.status === "collecting" ? (
        <div className="mx-6 mb-4 px-3.5 py-2.5 bg-fumi-bg-warm rounded-[10px] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-fumi-text-muted" />
          <span className="font-[family-name:var(--font-dm-sans)] text-[12px] text-fumi-text-muted">
            {lang === "en" ? "Collecting entries..." : "Recopilando entradas..."}
          </span>
        </div>
      ) : chapter.status === "approved" ? (
        <div className="mx-6 mb-4 px-3.5 py-2.5 bg-fumi-success/10 rounded-[10px] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-fumi-success" />
          <span className="font-[family-name:var(--font-dm-sans)] text-[12px] text-fumi-success">
            {lang === "en" ? "Approved" : "Aprobado"} · {chapter.entryIds.length} {ce.entriesSuffix} ·{" "}
            {ce.voiceSuffix}: {voices.find((v) => v.id === voice)?.label}
          </span>
        </div>
      ) : (
        <div className="mx-6 mb-4 px-3.5 py-2.5 bg-fumi-accent/10 rounded-[10px] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-fumi-accent" />
          <span className="font-[family-name:var(--font-dm-sans)] text-[12px] text-fumi-accent">
            {ce.draftGenerated} · {chapter.entryIds.length} {ce.entriesSuffix} ·{" "}
            {ce.voiceSuffix}: {voices.find((v) => v.id === voice)?.label}
          </span>
        </div>
      )}

      {/* Language mismatch banner */}
      {showTranslateBanner && !isTranslating && (
        <div className="mx-6 mb-3 px-4 py-3 bg-fumi-accent/5 border border-fumi-accent/20 rounded-[12px] flex items-center justify-between gap-3">
          <p className="font-[family-name:var(--font-dm-sans)] text-[12px] text-fumi-text-secondary m-0">
            {ce.translateBanner}
          </p>
          <button
            onClick={handleTranslate}
            className="shrink-0 px-3.5 py-1.5 rounded-[20px] border-none bg-fumi-accent text-white font-[family-name:var(--font-dm-sans)] text-[11px] font-medium cursor-pointer"
          >
            {ce.translateButton}
          </button>
        </div>
      )}

      {/* Error message */}
      {actionError && (
        <div className="mx-6 mb-3 px-4 py-2.5 bg-red-50 border border-red-200 rounded-[10px] flex items-center justify-between">
          <p className="font-[family-name:var(--font-dm-sans)] text-[12px] text-red-500 m-0">
            {actionError}
          </p>
          <button
            onClick={() => setActionError("")}
            className="text-red-400 bg-transparent border-none cursor-pointer text-[14px] p-0 ml-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Chapter content */}
      <div className="mx-6 p-5 bg-white rounded-[14px] border border-fumi-border mb-3 relative">
        {(isRegenerating || isTranslating) && (
          <div className="absolute inset-0 bg-white/80 rounded-[14px] flex flex-col items-center justify-center z-10 gap-2">
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-fumi-accent"
                  style={{ animation: `fade-dots 1s ${i * 0.2}s infinite` }}
                />
              ))}
            </div>
            {isTranslating && (
              <p className="font-[family-name:var(--font-dm-sans)] text-[12px] text-fumi-accent m-0">
                {ce.translating}
              </p>
            )}
          </div>
        )}
        {editing ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full border-none outline-none resize-none font-[family-name:var(--font-playfair)] text-[15px] text-fumi-text leading-[1.75] min-h-[280px] bg-transparent"
          />
        ) : (
          <div>{renderChapterContent()}</div>
        )}
      </div>

      {/* Add own text panel */}
      {showAddBlock && (
        <div className="mx-6 mb-3 p-4 bg-fumi-ai-bg rounded-[12px]">
          <div className="flex items-center gap-1.5 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-fumi-accent" />
            <span className="font-[family-name:var(--font-dm-sans)] text-[11px] uppercase tracking-[0.08em] text-fumi-accent">
              {ce.addOwnTextLabel}
            </span>
          </div>

          <textarea
            value={newBlockText}
            onChange={(e) => handleNewBlockTextChange(e.target.value)}
            placeholder={ce.ownTextPlaceholder}
            className="w-full border border-fumi-border outline-none resize-none font-[family-name:var(--font-playfair)] text-[15px] text-fumi-text leading-[1.75] min-h-[100px] bg-white rounded-[10px] p-3 italic"
          />

          {/* AI placement suggestion */}
          {aiSuggestion && (
            <div className="mt-2.5 flex items-start gap-2">
              <p className="font-[family-name:var(--font-dm-sans)] text-[12px] text-fumi-text-secondary m-0 leading-[1.5] flex-1">
                <span className="text-fumi-accent">✦</span>{" "}
                {ce.aiSuggestPrefix}{" "}
                <strong className="font-medium text-fumi-text">
                  {ce.aiSuggestAfter} {aiSuggestion.reason}
                </strong>
              </p>
              {!showNudge ? (
                <button
                  onClick={() => setShowNudge(true)}
                  className="font-[family-name:var(--font-dm-sans)] text-[11px] text-fumi-text-muted bg-transparent border-none cursor-pointer p-0 shrink-0 hover:text-fumi-accent transition-colors"
                >
                  {ce.changeNudge}
                </button>
              ) : (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleNudge("up")}
                    disabled={insertAtIndex === 0}
                    className="w-6 h-6 rounded-full border border-fumi-border bg-white text-fumi-text-muted text-[11px] cursor-pointer flex items-center justify-center hover:border-fumi-accent hover:text-fumi-accent transition-colors disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => handleNudge("down")}
                    disabled={insertAtIndex === paragraphs.length - 1}
                    className="w-6 h-6 rounded-full border border-fumi-border bg-white text-fumi-text-muted text-[11px] cursor-pointer flex items-center justify-center hover:border-fumi-accent hover:text-fumi-accent transition-colors disabled:opacity-30"
                  >
                    ↓
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="mt-3 flex gap-2">
            <button
              onClick={handleSaveBlock}
              disabled={!newBlockText.trim()}
              className="flex-1 py-2.5 rounded-[10px] border-none bg-fumi-accent text-white font-[family-name:var(--font-dm-sans)] text-[13px] font-medium cursor-pointer disabled:opacity-40 transition-opacity"
            >
              {ce.saveText}
            </button>
            <button
              onClick={() => {
                setShowAddBlock(false);
                setNewBlockText("");
                setInsertAtIndex(null);
                setAiSuggestion(null);
                setShowNudge(false);
              }}
              className="px-4 py-2.5 rounded-[10px] border border-fumi-border bg-transparent font-[family-name:var(--font-dm-sans)] text-[13px] text-fumi-text-secondary cursor-pointer"
            >
              {ce.cancel}
            </button>
          </div>
        </div>
      )}

      {/* Regeneration input */}
      {showRegenInput && (
        <div className="mx-6 mb-3 p-4 bg-fumi-ai-bg rounded-[12px]">
          <p className="font-[family-name:var(--font-dm-sans)] text-[11px] uppercase tracking-[0.08em] text-fumi-text-muted m-0 mb-2">
            {ce.regenPromptLabel}
          </p>
          <textarea
            value={regenInstruction}
            onChange={(e) => setRegenInstruction(e.target.value)}
            placeholder={ce.regenPlaceholder}
            className="w-full border-none outline-none resize-none font-[family-name:var(--font-dm-sans)] text-[13px] text-fumi-text leading-[1.55] min-h-[60px] bg-transparent"
          />
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="mt-2 px-5 py-2.5 rounded-[10px] border-none bg-fumi-accent text-white font-[family-name:var(--font-dm-sans)] text-[13px] font-medium cursor-pointer disabled:opacity-50"
          >
            {isRegenerating
              ? lang === "es"
                ? "Regenerando..."
                : "Regenerating..."
              : ce.regenButton}
          </button>
        </div>
      )}

      {/* Action buttons */}
      <div className="px-6 pt-1 flex gap-2 pb-2">
        <button
          onClick={handlePreviewToggle}
          className={`flex-1 py-3 rounded-[12px] border border-fumi-border font-[family-name:var(--font-dm-sans)] text-[13px] text-fumi-text-secondary cursor-pointer ${
            editing ? "bg-fumi-bg-warm" : "bg-transparent"
          }`}
        >
          {editing ? ce.preview : ce.editText}
        </button>
        <button
          onClick={() => {
            setShowRegenInput(!showRegenInput);
            setEditing(false);
          }}
          className={`flex-1 py-3 rounded-[12px] border-none font-[family-name:var(--font-dm-sans)] text-[13px] font-medium cursor-pointer ${
            showRegenInput
              ? "bg-fumi-accent-soft text-fumi-accent"
              : "bg-fumi-accent text-white"
          }`}
        >
          {ce.regenerate}
        </button>
        <button
          onClick={() => setShowShareModal(true)}
          className="py-3 px-4 rounded-[12px] border border-fumi-border bg-transparent font-[family-name:var(--font-dm-sans)] text-[13px] text-fumi-text-secondary cursor-pointer hover:border-fumi-accent hover:text-fumi-accent transition-colors"
        >
          {ce.shareButton}
        </button>
      </div>

      {/* Add own text button */}
      <div className="px-6 pb-3">
        <button
          onClick={() => {
            setShowAddBlock(!showAddBlock);
            setShowRegenInput(false);
            setEditing(false);
          }}
          className="w-full py-3 rounded-[12px] border border-dashed border-fumi-accent-soft bg-transparent font-[family-name:var(--font-dm-sans)] text-[13px] text-fumi-accent cursor-pointer"
        >
          {showAddBlock
            ? ce.cancel
            : `${ce.addOwnText}${ownBlocks.length > 0 ? ` (${ownBlocks.length})` : ""}`}
        </button>
      </div>

      {/* Approve button */}
      <div className="px-6 pb-6">
        {approved ? (
          <div className="w-full py-3 rounded-[12px] bg-fumi-success/10 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-fumi-success" />
            <span className="font-[family-name:var(--font-dm-sans)] text-[13px] text-fumi-success font-medium">
              {lang === "en" ? "Approved ✓" : "Aprobado ✓"}
            </span>
          </div>
        ) : (
          <button
            onClick={handleApprove}
            className="w-full py-3 rounded-[12px] border border-fumi-success/40 bg-transparent font-[family-name:var(--font-dm-sans)] text-[13px] text-fumi-success cursor-pointer hover:bg-fumi-success/5 transition-colors"
          >
            {lang === "en" ? "Mark as approved ✓" : "Marcar como aprobado ✓"}
          </button>
        )}
      </div>

      {/* Share card modal */}
      {showShareModal && chapter && (
        <ShareCardModal
          excerpt={paragraphs[0] ?? content.slice(0, 200)}
          babyName={babyName}
          monthLabel={`${ce.monthPrefix} ${chapter.month}`}
          period={chapter.period}
          photos={entryPhotos}
          onClose={() => setShowShareModal(false)}
          t={{
            shareTitle: ce.shareTitle,
            shareDownload: ce.shareDownload,
            shareShare: ce.shareShare,
            shareClose: ce.shareClose,
          }}
        />
      )}
    </AppShell>
  );
}
