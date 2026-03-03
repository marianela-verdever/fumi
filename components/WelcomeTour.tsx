"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useLang } from "@/lib/lang-context";

interface WelcomeTourProps {
  babyName: string;
  onComplete: () => void;
}

const screens = [
  {
    icon: "✦",
    gradient: "from-[#F5EDE4] to-[#EDE3D8]",
    accentOpacity: 0.15,
  },
  {
    icon: "◬",
    gradient: "from-[#EDE3D8] to-[#E8DDD2]",
    accentOpacity: 0.12,
  },
  {
    icon: "◻",
    gradient: "from-[#E8DDD2] to-[#E2D5C8]",
    accentOpacity: 0.1,
  },
];

export default function WelcomeTour({ babyName, onComplete }: WelcomeTourProps) {
  const { t, lang } = useLang();
  const [page, setPage] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Touch swipe tracking
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  // Mount check for portal (SSR safety)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll while tour is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const tourScreens = [
    { title: t.tour.screen1Title, desc: t.tour.screen1Desc },
    { title: t.tour.screen2Title, desc: t.tour.screen2Desc },
    { title: t.tour.screen3Title, desc: t.tour.screen3Desc },
  ];

  const handleComplete = () => {
    setExiting(true);
    setTimeout(() => {
      localStorage.setItem("fumi_tour_done", "1");
      onComplete();
    }, 400);
  };

  const handleNext = () => {
    if (page < 2) {
      setPage(page + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Only trigger if horizontal swipe is dominant (not a vertical scroll)
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX < 0 && page < 2) {
        // Swipe left → next
        setPage(page + 1);
      } else if (deltaX > 0 && page > 0) {
        // Swipe right → previous
        setPage(page - 1);
      }
    }
  };

  const screen = screens[page];
  const content = tourScreens[page];

  const tourContent = (
    <div
      className={`fixed inset-0 z-[200] flex flex-col transition-opacity duration-400 ${
        exiting ? "opacity-0" : "opacity-100"
      }`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background */}
      <div className={`absolute inset-0 bg-gradient-to-b ${screen.gradient}`} />

      {/* Skip button */}
      <div className="relative z-10 flex justify-end px-6 pt-6 safe-area-top">
        <button
          onClick={handleSkip}
          className="font-[family-name:var(--font-dm-sans)] text-[13px] text-fumi-text-muted bg-white/50 border-none rounded-[20px] px-4 py-1.5 cursor-pointer hover:bg-white/70 transition-colors"
        >
          {t.tour.skip}
        </button>
      </div>

      {/* Content area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-10 max-w-[390px] mx-auto w-full">
        {/* Decorative icon */}
        <div
          className="w-[120px] h-[120px] rounded-full flex items-center justify-center mb-10"
          style={{
            background: `radial-gradient(circle, rgba(196,112,63,${screen.accentOpacity}) 0%, transparent 70%)`,
          }}
        >
          <span
            key={`icon-${page}`}
            className="text-[48px] text-fumi-accent"
            style={{ animation: "scale-in 0.5s ease-out" }}
          >
            {screen.icon}
          </span>
        </div>

        {/* Title */}
        <h2
          key={`title-${page}`}
          className="font-[family-name:var(--font-playfair)] text-[28px] font-medium text-fumi-text text-center m-0 mb-3"
          style={{ animation: "slide-up 0.4s ease-out" }}
        >
          {content.title}
        </h2>

        {/* Description */}
        <p
          key={`desc-${page}`}
          className="font-[family-name:var(--font-dm-sans)] text-[15px] text-fumi-text-secondary text-center leading-relaxed m-0 max-w-[300px]"
          style={{ animation: "slide-up 0.4s ease-out 0.08s both" }}
        >
          {content.desc}
        </p>
      </div>

      {/* Bottom area: dots + button — extra padding to clear navbar */}
      <div className="relative z-10 px-8 pb-24 sm:pb-10 safe-area-bottom max-w-[390px] mx-auto w-full">
        {/* Dots */}
        <div className="flex justify-center gap-2 mb-6">
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`rounded-full border-none cursor-pointer transition-all ${
                i === page
                  ? "w-6 h-2 bg-fumi-accent"
                  : "w-2 h-2 bg-fumi-text-muted/30"
              }`}
            />
          ))}
        </div>

        {/* CTA button */}
        <button
          onClick={handleNext}
          className="w-full py-4 rounded-[14px] border-none bg-fumi-accent text-white font-[family-name:var(--font-dm-sans)] text-[15px] font-medium cursor-pointer transition-all hover:opacity-90 active:scale-[0.98]"
        >
          {page < 2 ? t.tour.next : t.tour.done}
        </button>

        {/* Baby name flourish on last screen */}
        {page === 2 && (
          <p
            className="font-[family-name:var(--font-playfair)] text-[13px] italic text-fumi-accent/60 text-center mt-3 m-0"
            style={{ animation: "slide-up 0.4s ease-out 0.15s both" }}
          >
            {lang === "es" ? "para" : "for"} {babyName}
          </p>
        )}
      </div>
    </div>
  );

  // Render via portal to escape AppShell stacking context
  if (!mounted) return null;
  return createPortal(tourContent, document.body);
}
