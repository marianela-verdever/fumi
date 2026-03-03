"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import WelcomeTour from "@/components/WelcomeTour";
import type { Baby, Entry } from "@/lib/types";
import { calculateAge, formatDate } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";
import { rowToEntry } from "@/lib/supabase/types";
import { useLang } from "@/lib/lang-context";

function ImageModal({
  urls,
  initialIndex,
  onClose,
}: {
  urls: string[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(initialIndex);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && current < urls.length - 1)
        setCurrent((c) => c + 1);
      if (e.key === "ArrowLeft" && current > 0) setCurrent((c) => c - 1);
    },
    [current, urls.length, onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [handleKey]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 safe-area-top w-9 h-9 flex items-center justify-center rounded-full bg-white/15 text-white text-lg border-none cursor-pointer z-[101] hover:bg-white/25 transition-colors"
        aria-label="Close"
      >
        ✕
      </button>

      {/* Image */}
      <img
        src={urls[current]}
        alt=""
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Navigation arrows */}
      {urls.length > 1 && (
        <>
          {current > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrent((c) => c - 1);
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-white/15 text-white text-base border-none cursor-pointer hover:bg-white/25 transition-colors"
              aria-label="Previous"
            >
              ‹
            </button>
          )}
          {current < urls.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrent((c) => c + 1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-white/15 text-white text-base border-none cursor-pointer hover:bg-white/25 transition-colors"
              aria-label="Next"
            >
              ›
            </button>
          )}
          {/* Dots indicator */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
            {urls.map((_, i) => (
              <span
                key={i}
                className={`block w-1.5 h-1.5 rounded-full transition-colors ${
                  i === current ? "bg-white" : "bg-white/40"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function BabyHeader({ baby }: { baby: Baby }) {
  const { t } = useLang();

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
      <div className="bg-fumi-accent-soft rounded-[20px] px-3.5 py-1.5 mt-2">
        <span className="font-[family-name:var(--font-dm-sans)] text-[12px] text-fumi-accent font-medium">
          {calculateAge(baby.birthDate)}
        </span>
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

function TimelineEntry({
  entry,
  isLast,
  index,
  onImageClick,
}: {
  entry: Entry;
  isLast: boolean;
  index: number;
  onImageClick: (urls: string[], startIndex: number) => void;
}) {
  const router = useRouter();
  const { t } = useLang();
  const isMilestone =
    entry.tags.includes("milestone") || entry.tags.includes("primera vez");
  const displayTag = (tag: string) => t.add.tags[tag] ?? tag;

  const goToEdit = () => router.push(`/entry/${entry.id}`);

  return (
    <div
      className="flex gap-4 group"
      style={{ animation: `slide-up 0.4s ease-out ${index * 0.06}s both` }}
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

      <div className="pb-6 flex-grow">
        {/* Date + tags — click to edit */}
        <div
          className="flex items-center gap-2 mb-1.5 cursor-pointer"
          onClick={goToEdit}
        >
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

        {/* Image — click to preview */}
        {entry.mediaUrls.length > 0 && entry.mediaUrls[0] && (
          <div
            className="relative mb-2 cursor-pointer"
            onClick={() => onImageClick(entry.mediaUrls, 0)}
          >
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

        {/* Text — click to edit */}
        <p
          className="font-[family-name:var(--font-playfair)] text-[15px] text-fumi-text m-0 leading-[1.6] cursor-pointer hover:opacity-70 transition-opacity"
          onClick={goToEdit}
        >
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
  const router = useRouter();
  const { t } = useLang();
  return (
    <div className="px-6 pb-24 flex flex-col items-center justify-center py-12">
      {/* Decorative icon */}
      <div
        className="w-[80px] h-[80px] rounded-full flex items-center justify-center mb-5"
        style={{
          background:
            "radial-gradient(circle, rgba(196,112,63,0.1) 0%, transparent 70%)",
        }}
      >
        <span className="text-[32px] text-fumi-accent/60">✦</span>
      </div>

      <h3 className="font-[family-name:var(--font-playfair)] text-[20px] font-medium text-fumi-text text-center m-0 mb-2">
        {t.emptyTimeline.title}
      </h3>
      <p className="font-[family-name:var(--font-dm-sans)] text-[14px] text-fumi-text-secondary text-center leading-relaxed m-0 mb-6 max-w-[280px]">
        {t.emptyTimeline.desc}
      </p>
      <button
        onClick={() => router.push("/agregar")}
        className="px-6 py-3 rounded-[12px] border-none bg-fumi-accent text-white font-[family-name:var(--font-dm-sans)] text-[14px] font-medium cursor-pointer transition-all hover:opacity-90 active:scale-[0.98]"
      >
        {t.emptyTimeline.button}
      </button>
    </div>
  );
}

export default function TimelinePage() {
  const [baby, setBaby] = useState<Baby | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [hasDraftChapter, setHasDraftChapter] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [modalImages, setModalImages] = useState<{ urls: string[]; index: number } | null>(null);
  const [showNudge, setShowNudge] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const router = useRouter();
  const { t, lang } = useLang();

  useEffect(() => {
    const stored = localStorage.getItem("fumi_baby");
    if (!stored) {
      router.replace("/onboarding");
      return;
    }
    const babyObj: Baby = JSON.parse(stored);
    setBaby(babyObj);

    const tourDoneLocally = !!localStorage.getItem("fumi_tour_done");

    // Fetch entries
    supabase
      .from("entries")
      .select("*")
      .eq("baby_id", babyObj.id)
      .order("date", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) {
          const mapped = data.map(rowToEntry);
          setEntries(mapped);

          // Show tour only if: not done locally AND user has no entries yet (new user)
          // If user already has entries, they're not new — skip tour even on new device
          if (!tourDoneLocally && mapped.length === 0) {
            setShowTour(true);
          } else if (!tourDoneLocally && mapped.length > 0) {
            // Returning user on new device — mark tour done silently
            localStorage.setItem("fumi_tour_done", "1");
          }

          // Check if no entries in the last 7 days → show nudge
          if (mapped.length > 0) {
            const latest = new Date(mapped[0].createdAt);
            const daysSince = Math.floor(
              (Date.now() - latest.getTime()) / (1000 * 60 * 60 * 24)
            );
            if (daysSince >= 7) setShowNudge(true);
          }
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
      {showNudge && (
        <div className="mx-6 mb-3 px-4 py-3 bg-fumi-accent/10 rounded-[12px] flex items-start gap-3">
          <span className="text-[18px] mt-0.5">✦</span>
          <div className="flex-1">
            <p className="font-[family-name:var(--font-dm-sans)] text-[13px] text-fumi-accent m-0 leading-[1.5]">
              {t.timeline.weeklyNudge} {baby.name}?
            </p>
          </div>
          <button
            onClick={() => setShowNudge(false)}
            className="text-fumi-accent/50 bg-transparent border-none cursor-pointer text-[14px] p-0 shrink-0"
          >
            ✕
          </button>
        </div>
      )}
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
              onImageClick={(urls, startIndex) =>
                setModalImages({ urls, index: startIndex })
              }
            />
          ))}
        </div>
      )}

      {modalImages && (
        <ImageModal
          urls={modalImages.urls}
          initialIndex={modalImages.index}
          onClose={() => setModalImages(null)}
        />
      )}

      {showTour && baby && (
        <WelcomeTour
          babyName={baby.name}
          onComplete={() => {
            setShowTour(false);
            // If no entries yet, guide to add page
            if (entries.length === 0) {
              router.push("/agregar?first=1");
            }
          }}
        />
      )}
    </AppShell>
  );
}
