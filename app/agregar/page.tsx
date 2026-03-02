"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Header from "@/components/layout/Header";
import type { Tag } from "@/lib/types";
import { getTodayISO, formatDate, getMonthNumber } from "@/lib/utils";
import { placeholders, placeholdersEN } from "@/lib/sample-data";
import { useLang } from "@/lib/lang-context";
import { supabase } from "@/lib/supabase/client";
import type { Baby } from "@/lib/types";

const allTags: Tag[] = ["primera vez", "milestone", "gracioso", "familia", "salud"];

type AudioState = "idle" | "recording" | "transcribing" | "done";

export default function AgregarPage() {
  const router = useRouter();
  const { t, lang } = useLang();
  const [date, setDate] = useState(getTodayISO());
  const [text, setText] = useState("");
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [audioState, setAudioState] = useState<AudioState>("idle");
  const [transcription, setTranscription] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [placeholder, setPlaceholder] = useState("");

  useEffect(() => {
    const pool = lang === "en" ? placeholdersEN : placeholders;
    setPlaceholder(pool[Math.floor(Math.random() * pool.length)]);
  }, [lang]);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const toggleTag = (tag: Tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAudio = async () => {
    if (audioState === "idle") {
      setAudioState("recording");
    } else if (audioState === "recording") {
      setAudioState("transcribing");

      try {
        const formData = new FormData();
        const dummyBlob = new Blob(["mock-audio"], { type: "audio/webm" });
        formData.append("audio", dummyBlob, "recording.webm");
        formData.append("lang", lang);

        const res = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        setTranscription(data.text);
        setAudioState("done");
      } catch {
        setAudioState("idle");
        setTranscription("");
      }
    }
  };

  const handleSave = async () => {
    const content = text || transcription;
    if (!content.trim()) return;

    const stored = localStorage.getItem("fumi_baby");
    if (!stored) return;
    const baby: Baby = JSON.parse(stored);

    setSaving(true);
    setSaveError("");

    const { data: entryData, error } = await supabase
      .from("entries")
      .insert({
        baby_id: baby.id,
        date,
        type: transcription ? "audio" : "text",
        content: content.trim(),
        media_urls: [],
        tags: selectedTags,
      })
      .select()
      .single();

    if (error || !entryData) {
      setSaveError(lang === "en" ? "Could not save. Try again." : "No se pudo guardar. Intentá de nuevo.");
      setSaving(false);
      return;
    }

    // Link entry to chapter if one exists for this month
    const month = getMonthNumber(date, baby.birthDate);
    const { data: chapterData } = await supabase
      .from("chapters")
      .select("id, entry_ids")
      .eq("baby_id", baby.id)
      .eq("month", month)
      .single();

    if (chapterData) {
      const updatedIds = [...(chapterData.entry_ids ?? []), entryData.id];
      await supabase
        .from("chapters")
        .update({ entry_ids: updatedIds })
        .eq("id", chapterData.id);
    }

    router.push("/timeline");
  };

  return (
    <AppShell>
      <Header title={t.add.title} subtitle={t.add.subtitle} />

      <div className="px-6 pt-4 flex flex-col gap-4">
        {/* Date picker */}
        <div className="relative">
          <button
            onClick={() => dateInputRef.current?.showPicker()}
            className="flex items-center gap-2 bg-fumi-bg-warm border-none rounded-[10px] px-3.5 py-2.5 cursor-pointer"
          >
            <span className="font-[family-name:var(--font-dm-sans)] text-[13px] text-fumi-text-secondary">
              {date === getTodayISO()
                ? `${t.add.today}, ${formatDate(date)}`
                : formatDate(date)}
            </span>
            <span className="text-[12px] text-fumi-text-muted">✎</span>
          </button>
          <input
            ref={dateInputRef}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={getTodayISO()}
            className="absolute opacity-0 w-0 h-0"
          />
        </div>

        {/* Photo upload */}
        <div className="w-full h-[160px] border-2 border-dashed border-fumi-border rounded-[14px] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-fumi-accent-soft transition-colors">
          <span className="text-[28px] text-fumi-text-muted">⊕</span>
          <span className="font-[family-name:var(--font-dm-sans)] text-[13px] text-fumi-text-muted">
            {t.add.addMedia}
          </span>
        </div>

        {/* Text input */}
        <div className="bg-white border border-fumi-border rounded-[14px] p-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder}
            className="w-full border-none outline-none resize-none font-[family-name:var(--font-playfair)] text-[15px] text-fumi-text leading-[1.6] min-h-[80px] bg-transparent"
          />
        </div>

        {/* Audio recorder */}
        <div
          className={`rounded-[12px] px-4 py-3.5 transition-all ${
            audioState !== "idle" ? "bg-fumi-ai-bg" : "bg-fumi-bg-warm"
          }`}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={handleAudio}
              className={`w-9 h-9 rounded-full border-none flex items-center justify-center text-white shrink-0 cursor-pointer ${
                audioState === "recording"
                  ? "bg-[#D94F4F] animate-[pulse-recording_1.5s_infinite]"
                  : "bg-fumi-accent"
              }`}
            >
              {audioState === "recording" ? "◼" : "●"}
            </button>
            <span
              className={`font-[family-name:var(--font-dm-sans)] text-[13px] ${
                audioState === "recording"
                  ? "text-[#D94F4F]"
                  : "text-fumi-text-secondary"
              }`}
            >
              {audioState === "idle" && t.add.recordIdle}
              {audioState === "recording" && t.add.recordRecording}
              {audioState === "transcribing" && t.add.recordTranscribing}
              {audioState === "done" && t.add.recordDone}
            </span>
          </div>

          {audioState === "transcribing" && (
            <div className="mt-3 flex gap-1.5 justify-center">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-fumi-accent"
                  style={{ animation: `fade-dots 1s ${i * 0.2}s infinite` }}
                />
              ))}
            </div>
          )}

          {audioState === "done" && (
            <div className="mt-3 p-3 bg-white rounded-[10px] border border-fumi-border">
              <p className="font-[family-name:var(--font-dm-sans)] text-[11px] uppercase tracking-[0.08em] text-fumi-text-muted m-0 mb-1.5">
                {t.add.transcriptionLabel}
              </p>
              <textarea
                value={transcription}
                onChange={(e) => setTranscription(e.target.value)}
                className="w-full border-none outline-none resize-none font-[family-name:var(--font-playfair)] text-[14px] text-fumi-text leading-[1.6] min-h-[60px] bg-transparent"
              />
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex gap-2 flex-wrap">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`border rounded-[20px] px-3.5 py-1.5 cursor-pointer font-[family-name:var(--font-dm-sans)] text-[12px] transition-colors ${
                selectedTags.includes(tag)
                  ? "bg-fumi-accent-soft border-fumi-accent text-fumi-accent"
                  : "bg-transparent border-fumi-border text-fumi-text-secondary"
              }`}
            >
              {t.add.tags[tag] ?? tag}
            </button>
          ))}
        </div>

        {saveError && (
          <p className="font-[family-name:var(--font-dm-sans)] text-[13px] text-red-400 text-center">
            {saveError}
          </p>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={(!text.trim() && !transcription.trim()) || saving}
          className="w-full bg-fumi-accent text-white border-none rounded-[12px] py-4 font-[family-name:var(--font-dm-sans)] text-[15px] font-medium cursor-pointer mt-1 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          {saving ? "..." : t.add.saveButton}
        </button>
      </div>
    </AppShell>
  );
}
