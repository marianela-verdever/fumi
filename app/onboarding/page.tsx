"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getTodayISO } from "@/lib/utils";
import { useLang } from "@/lib/lang-context";
import type { Lang } from "@/lib/i18n";
import { supabase } from "@/lib/supabase/client";
import { rowToBaby } from "@/lib/supabase/types";
import { voiceDrafts } from "@/lib/sample-data";

// Chapter periods for months 1–3 (approximate)
function chapterPeriod(month: number, birthDate: string): string {
  const d = new Date(birthDate);
  d.setMonth(d.getMonth() + month - 1);
  const start = d.toLocaleDateString("es-AR", { month: "short", year: "numeric" });
  d.setMonth(d.getMonth() + 1);
  const end = d.toLocaleDateString("es-AR", { month: "short", year: "numeric" });
  return `${start} — ${end}`;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { lang, setLang, t } = useLang();
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !birthDate) return;
    setLoading(true);
    setError("");

    // 1. Insert baby
    const { data: babyData, error: babyErr } = await supabase
      .from("babies")
      .insert({ name: name.trim(), birth_date: birthDate })
      .select()
      .single();

    if (babyErr || !babyData) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    const baby = rowToBaby(babyData);

    // 2. Seed starter chapters (months 1–3)
    const starterChapters = [
      {
        baby_id: baby.id,
        month: 1,
        period: chapterPeriod(1, birthDate),
        status: "approved",
        voice: "baby",
        generated_content: voiceDrafts.baby,
        own_text_blocks: [],
        entry_ids: [],
      },
      {
        baby_id: baby.id,
        month: 2,
        period: chapterPeriod(2, birthDate),
        status: "draft",
        voice: "baby",
        generated_content: "",
        own_text_blocks: [],
        entry_ids: [],
      },
      {
        baby_id: baby.id,
        month: 3,
        period: chapterPeriod(3, birthDate),
        status: "collecting",
        voice: "baby",
        generated_content: "",
        own_text_blocks: [],
        entry_ids: [],
      },
    ];

    await supabase.from("chapters").insert(starterChapters);

    // 3. Persist baby to localStorage (session anchor)
    localStorage.setItem("fumi_baby", JSON.stringify(baby));
    localStorage.removeItem("fumi_entries"); // clear any stale data

    router.replace("/timeline");
  };

  const tagline = t.onboarding.tagline.split("\n");

  return (
    <div className="w-full max-w-[390px] min-h-dvh mx-auto bg-fumi-bg flex flex-col justify-center px-8">
      {/* Language toggle */}
      <div className="absolute top-6 right-6 flex gap-1.5">
        {(["en", "es"] as Lang[]).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`px-3 py-1 rounded-[20px] font-[family-name:var(--font-dm-sans)] text-[11px] uppercase tracking-[0.08em] cursor-pointer transition-all ${
              lang === l
                ? "bg-fumi-accent text-white border-none"
                : "bg-transparent border border-fumi-border text-fumi-text-muted"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="mb-12">
        <span className="font-[family-name:var(--font-playfair)] text-[32px] text-fumi-accent font-medium italic">
          fumi.
        </span>
        <p className="font-[family-name:var(--font-dm-sans)] text-[15px] text-fumi-text-secondary mt-3 leading-relaxed">
          {tagline[0]}
          {tagline[1] && (
            <>
              <br />
              {tagline[1]}
            </>
          )}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="font-[family-name:var(--font-dm-sans)] text-[11px] uppercase tracking-[0.1em] text-fumi-text-muted block mb-2">
            {t.onboarding.babyNameLabel}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Aurora"
            className="w-full bg-white border border-fumi-border rounded-[14px] px-4 py-3.5 font-[family-name:var(--font-playfair)] text-[18px] text-fumi-text outline-none focus:border-fumi-accent transition-colors"
          />
        </div>

        <div>
          <label className="font-[family-name:var(--font-dm-sans)] text-[11px] uppercase tracking-[0.1em] text-fumi-text-muted block mb-2">
            {t.onboarding.birthDateLabel}
          </label>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            max={getTodayISO()}
            className="w-full bg-white border border-fumi-border rounded-[14px] px-4 py-3.5 font-[family-name:var(--font-dm-sans)] text-[15px] text-fumi-text outline-none focus:border-fumi-accent transition-colors"
          />
        </div>

        {error && (
          <p className="font-[family-name:var(--font-dm-sans)] text-[13px] text-red-400 text-center -mt-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!name.trim() || !birthDate || loading}
          className="w-full bg-fumi-accent text-white border-none rounded-[12px] py-4 font-[family-name:var(--font-dm-sans)] text-[15px] font-medium cursor-pointer mt-2 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          {loading ? "..." : t.onboarding.startButton}
        </button>
      </form>
    </div>
  );
}
