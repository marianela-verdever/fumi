"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Header from "@/components/layout/Header";
import type { Tag, Entry, Baby } from "@/lib/types";
import { getTodayISO, formatDate } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";
import { rowToEntry } from "@/lib/supabase/types";
import { useLang } from "@/lib/lang-context";

const allTags: Tag[] = ["primera vez", "milestone", "gracioso", "familia", "salud"];

export default function EditEntryPage() {
  const params = useParams();
  const entryId = params.id as string;
  const router = useRouter();
  const { t, lang } = useLang();

  const [entry, setEntry] = useState<Entry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [date, setDate] = useState("");
  const [text, setText] = useState("");
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const dateInputRef = useRef<HTMLInputElement>(null);

  // Load entry from Supabase
  useEffect(() => {
    supabase
      .from("entries")
      .select("*")
      .eq("id", entryId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true);
        } else {
          const e = rowToEntry(data);
          setEntry(e);
          setDate(e.date);
          setText(e.content);
          setSelectedTags(e.tags);
        }
        setIsLoading(false);
      });
  }, [entryId]);

  const toggleTag = (tag: Tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = async () => {
    if (!text.trim()) return;
    setSaving(true);
    setSaveError("");

    const { error } = await supabase
      .from("entries")
      .update({
        date,
        content: text.trim(),
        tags: selectedTags,
      })
      .eq("id", entryId);

    if (error) {
      setSaveError(
        lang === "en"
          ? "Could not save. Try again."
          : "No se pudo guardar. Intentá de nuevo."
      );
      setSaving(false);
      return;
    }

    router.push("/timeline");
  };

  const handleDelete = async () => {
    setDeleting(true);

    // Also remove entry from any chapter's entry_ids
    const stored = localStorage.getItem("fumi_baby");
    if (stored) {
      const baby: Baby = JSON.parse(stored);
      const { data: chapters } = await supabase
        .from("chapters")
        .select("id, entry_ids")
        .eq("baby_id", baby.id);

      if (chapters) {
        for (const ch of chapters) {
          if (ch.entry_ids?.includes(entryId)) {
            const updated = ch.entry_ids.filter((id: string) => id !== entryId);
            await supabase
              .from("chapters")
              .update({ entry_ids: updated })
              .eq("id", ch.id);
          }
        }
      }
    }

    const { error } = await supabase
      .from("entries")
      .delete()
      .eq("id", entryId);

    if (error) {
      setSaveError(
        lang === "en"
          ? "Could not delete. Try again."
          : "No se pudo eliminar. Intentá de nuevo."
      );
      setDeleting(false);
      return;
    }

    router.push("/timeline");
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <AppShell>
        <div className="px-6 pt-5 pb-24 flex flex-col gap-4">
          <div className="h-7 w-32 bg-fumi-border rounded-full" />
          <div className="h-4 w-48 bg-fumi-border rounded-full" />
          <div className="h-[120px] bg-fumi-border rounded-[14px] mt-2" />
        </div>
      </AppShell>
    );
  }

  // Not found
  if (notFound || !entry) {
    return (
      <AppShell>
        <div className="px-6 pt-12 flex flex-col items-center">
          <p className="font-[family-name:var(--font-playfair)] text-[18px] text-fumi-text-muted text-center italic">
            {lang === "en" ? "Moment not found." : "Momento no encontrado."}
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Header
        title={t.editEntry.title}
        subtitle={formatDate(entry.date)}
      />

      <div className="px-6 pt-4 flex flex-col gap-4">
        {/* Photos */}
        {entry.mediaUrls.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {entry.mediaUrls.map((url, i) => (
              <div key={i} className="w-[100px] h-[100px] rounded-[10px] overflow-hidden">
                <img
                  src={url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}

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

        {/* Text input */}
        <div className="bg-white border border-fumi-border rounded-[14px] p-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full border-none outline-none resize-none font-[family-name:var(--font-playfair)] text-[15px] text-fumi-text leading-[1.6] min-h-[100px] bg-transparent"
          />
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
          disabled={!text.trim() || saving}
          className="w-full bg-fumi-accent text-white border-none rounded-[12px] py-4 font-[family-name:var(--font-dm-sans)] text-[15px] font-medium cursor-pointer mt-1 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          {saving ? "..." : t.editEntry.updateButton}
        </button>

        {/* Delete button */}
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full bg-transparent text-red-400 border border-red-200 rounded-[12px] py-3 font-[family-name:var(--font-dm-sans)] text-[13px] cursor-pointer transition-colors hover:bg-red-50"
          >
            {t.editEntry.deleteButton}
          </button>
        ) : (
          <div className="p-4 bg-red-50 rounded-[12px] border border-red-200 flex flex-col gap-3">
            <p className="font-[family-name:var(--font-dm-sans)] text-[13px] text-red-500 text-center m-0">
              {t.editEntry.deleteConfirm}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-[10px] border-none bg-red-400 text-white font-[family-name:var(--font-dm-sans)] text-[13px] font-medium cursor-pointer disabled:opacity-50"
              >
                {deleting ? "..." : t.editEntry.deleteButton}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-[10px] border border-fumi-border bg-white font-[family-name:var(--font-dm-sans)] text-[13px] text-fumi-text-secondary cursor-pointer"
              >
                {lang === "en" ? "Cancel" : "Cancelar"}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
