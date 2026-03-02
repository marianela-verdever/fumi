"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import type { Baby, Entry } from "@/lib/types";
import { calculateAge, formatDate } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";
import { rowToEntry } from "@/lib/supabase/types";
import { useLang } from "@/lib/lang-context";
import { useAuth } from "@/lib/auth-context";

function BabyHeader({ baby }: { baby: Baby }) {
  const { t } = useLang();
  const { signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <div className="px-6 pt-5 pb-4 flex justify-between items-start">
      <div>
        <p className="font-[family-name:var(--font-dm-sans)] text-[11px] uppercase tracking-[0.12em] text-fumi-text-muted m-0 mb-1">
          {t.timeline.storyOf}
        </p>
        <h1 className="font-[family-name:var(--font-playfair)] text-[34px] font-medium text-fumi-text m-0">
          {baby.name}
        </h1>
      </div>
      <div className="flex flex-col items-end gap-1.5 mt-2">
        <div className="bg-fumi-accent-soft rounded-[20px] px-3.5 py-1.5">
          <span className="font-[family-name:var(--font-dm-sans)] text-[12px] text-fumi-accent font-medium">
            {calculateAge(baby.birthDate)}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="font-[family-name:var(--font-dm-sans)] text-[11px] text-fumi-text-muted bg-transparent border-none cursor-pointer px-1"
        >
          {t.login.logout}
        </button>
      </div>
    </div>
  );
}

function AIBanner() {
  const router = useRouter();
  const { t } = useLang();

  return (
    <div
      onClick={() => router.push("/capitulos")}
      className="mx-6 mb-5 px-[18px] py-3.5 bg-fumi-ai-bg rounded-[12px] flex items-center gap-3 cursor-pointer hover:bg-fumi-accent-soft/50 transition-colors"
      style={{ animation: "scale-in 0.3s ease-out" }}
    >
      <span className="text-[16px]">✦</span>
      <p className="font-[family-name:var(--font-dm-sans)] text-[13px] text-fumi-text m-0 leading-[1.5] flex-1">
        {t.timeline.draftReadyPrefix}{" "}
        <strong className="font-semibold">
          {t.timeline.draftReadyMonthLabel} 1
        </strong>{" "}
        {t.timeline.draftReadySuffix}
      </p>
      <span className="text-[16px] text-fumi-text-muted">→</span>
    </div>
  );
}

function TimelineEntry({ entry, isLast, index }: { entry: Entry; isLast: boolean; index: number }) {
  const router = useRouter();
  const { t } = useLang();
  const isMilestone =
    entry.tags.includes("milestone") || entry.tags.includes("primera vez");
  const displayTag = (tag: string) => t.add.tags[tag] ?? tag;

  return (
    <div
      className="flex gap-4 cursor-pointer group"
      style={{ animation: `slide-up 0.4s ease-out ${index * 0.06}s both` }}
      onClick={() => router.push(`/entry/${entry.id}`)}
    >
      <div className="flex flex-col items-center w-5 shrink-0">
        <div
          className={`rounded-full shrink-0 mt-1.5 ${
            isMilestone
              ? "w-2.5 h-2.5 bg-fumi-accent"
              : "w-1.5 h-1.5 bg-fumi-text-muted"
          }`}
        />
        {!isLast && (
          <div className="w-px flex-grow bg-fumi-border min-h-[40px]" />
        )}
      </div>

      <div className="pb-6 flex-grow group-hover:opacity-70 transition-opacity">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="font-[family-name:var(--font-dm-sans)] text-[11px] text-fumi-text-muted">
            {formatDate(entry.date)}
          </span>
          {entry.tags.map((tag) => (
            <span
              key={tag}
              className="font-[family-name:var(--font-dm-sans)] text-[10px] text-fumi-accent bg-fumi-accent-soft px-2 py-0.5 rounded-[10px]"
            >
              {displayTag(tag)}
            </span>
          ))}
        </div>

        {entry.mediaUrls.length > 0 && entry.mediaUrls[0] && (
          <div className="relative mb-2">
            <img
              src={entry.mediaUrls[0]}
              alt=""
              className="w-full h-[140px] object-cover rounded-[10px]"
            />
            {entry.mediaUrls.length > 1 && (
              <span className="absolute bottom-2 right-2 bg-black/50 text-white font-[family-name:var(--font-dm-sans)] text-[11px] px-2 py-0.5 rounded-[8px]">
                +{entry.mediaUrls.length - 1}
              </span>
            )}
          </div>
        )}

        <p className="font-[family-name:var(--font-playfair)] text-[15px] text-fumi-text m-0 leading-[1.6]">
          {entry.content}
        </p>
      </div>
    </div>
  );
}

function TimelineSkeleton() {
  return (
    <div className="px-6 pb-24 flex flex-col gap-6">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center w-5 shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-fumi-border mt-1.5" />
            {i < 2 && <div className="w-px flex-grow bg-fumi-border min-h-[60px]" />}
          </div>
          <div className="pb-6 flex-grow">
            <div className="h-3 w-24 bg-fumi-border rounded-full mb-3" />
            <div className="h-4 w-full bg-fumi-border rounded-full mb-2" />
            <div className="h-4 w-3/4 bg-fumi-border rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyTimeline() {
  const { lang } = useLang();
  return (
    <div className="px-6 pb-24 flex flex-col items-center justify-center py-16">
      <p className="font-[family-name:var(--font-playfair)] text-[18px] text-fumi-text-muted text-center italic leading-[1.6]">
        {lang === "en"
          ? "No moments yet. Add your first one."
          : "Aún no hay momentos. Agregá el primero."}
      </p>
    </div>
  );
}

export default function TimelinePage() {
  const [baby, setBaby] = useState<Baby | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [hasDraftChapter, setHasDraftChapter] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { lang } = useLang();

  useEffect(() => {
    const stored = localStorage.getItem("fumi_baby");
    if (!stored) {
      router.replace("/onboarding");
      return;
    }
    const babyObj: Baby = JSON.parse(stored);
    setBaby(babyObj);

    // Fetch entries
    supabase
      .from("entries")
      .select("*")
      .eq("baby_id", babyObj.id)
      .order("date", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) {
          setEntries(data.map(rowToEntry));
        }
        setIsLoading(false);
      });

    // Check if there are any draft/approved chapters to show banner
    supabase
      .from("chapters")
      .select("id")
      .eq("baby_id", babyObj.id)
      .in("status", ["draft", "approved"])
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setHasDraftChapter(true);
        }
      });
  }, [router]);

  if (!baby) return null;

  return (
    <AppShell>
      <BabyHeader baby={baby} />
      {hasDraftChapter && <AIBanner />}

      {isLoading ? (
        <TimelineSkeleton />
      ) : entries.length === 0 ? (
        <EmptyTimeline />
      ) : (
        <div className="px-6 pb-24">
          {entries.map((entry, i) => (
            <TimelineEntry
              key={entry.id}
              entry={entry}
              isLast={i === entries.length - 1}
              index={i}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}
