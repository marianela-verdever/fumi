"use client";

import { useRef, useState, useCallback } from "react";
import html2canvas from "html2canvas";

interface ShareCardModalProps {
  excerpt: string;
  babyName: string;
  monthLabel: string;
  period: string;
  onClose: () => void;
  t: {
    shareTitle: string;
    shareDownload: string;
    shareShare: string;
    shareClose: string;
  };
}

export default function ShareCardModal({
  excerpt,
  babyName,
  monthLabel,
  period,
  onClose,
  t,
}: ShareCardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  // Trim excerpt to ~200 chars at word boundary
  const trimmed =
    excerpt.length > 200
      ? excerpt.slice(0, 200).replace(/\s+\S*$/, "") + "..."
      : excerpt;

  const generateImage = useCallback(async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    setGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
        logging: false,
      });
      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), "image/png", 1.0);
      });
    } finally {
      setGenerating(false);
    }
  }, []);

  const handleDownload = async () => {
    const blob = await generateImage();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fumi-${babyName.toLowerCase()}-${monthLabel.toLowerCase().replace(/\s/g, "-")}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const blob = await generateImage();
    if (!blob) return;
    const file = new File([blob], `fumi-${babyName.toLowerCase()}.png`, {
      type: "image/png",
    });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `fumi. — ${babyName}`,
        });
      } catch {
        // user cancelled share
      }
    } else {
      // Fallback to download
      handleDownload();
    }
  };

  const canShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-fumi-bg rounded-[16px] mx-4 max-w-[380px] w-full p-5 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-[family-name:var(--font-dm-sans)] text-[14px] text-fumi-text font-medium m-0 text-center">
          {t.shareTitle}
        </p>

        {/* Card preview (scaled down for display) */}
        <div className="flex justify-center">
          <div className="w-[270px] h-[480px] overflow-hidden rounded-[12px] shadow-lg">
            <div
              style={{
                transform: "scale(0.25)",
                transformOrigin: "top left",
                width: "1080px",
                height: "1920px",
              }}
            >
              {/* The actual card at 1080x1920 */}
              <div
                ref={cardRef}
                style={{
                  width: "1080px",
                  height: "1920px",
                  background: "linear-gradient(180deg, #FAF8F5 0%, #F5F0EB 40%, #EBE6DF 100%)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "120px 100px",
                  position: "relative",
                  fontFamily: "serif",
                }}
              >
                {/* Decorative dots at top */}
                <div
                  style={{
                    position: "absolute",
                    top: "100px",
                    left: "0",
                    right: "0",
                    display: "flex",
                    justifyContent: "center",
                    gap: "16px",
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        backgroundColor: "#C4703F",
                        opacity: 0.5 + i * 0.25,
                      }}
                    />
                  ))}
                </div>

                {/* Opening quotation mark */}
                <div
                  style={{
                    fontFamily: "Playfair Display, Georgia, serif",
                    fontSize: "200px",
                    color: "#C4703F",
                    opacity: 0.2,
                    lineHeight: "0.6",
                    marginBottom: "20px",
                    alignSelf: "flex-start",
                  }}
                >
                  &ldquo;
                </div>

                {/* Excerpt text */}
                <p
                  style={{
                    fontFamily: "Playfair Display, Georgia, serif",
                    fontSize: "52px",
                    lineHeight: "1.6",
                    color: "#1A1A1A",
                    textAlign: "center",
                    fontStyle: "italic",
                    margin: "0",
                    maxWidth: "880px",
                  }}
                >
                  {trimmed}
                </p>

                {/* Divider line */}
                <div
                  style={{
                    width: "80px",
                    height: "2px",
                    backgroundColor: "#C4703F",
                    margin: "60px 0",
                    opacity: 0.6,
                  }}
                />

                {/* Baby name + month */}
                <p
                  style={{
                    fontFamily: "DM Sans, Helvetica, sans-serif",
                    fontSize: "32px",
                    color: "#7A7267",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    margin: "0",
                  }}
                >
                  {babyName}
                </p>
                <p
                  style={{
                    fontFamily: "DM Sans, Helvetica, sans-serif",
                    fontSize: "26px",
                    color: "#B5ADA3",
                    margin: "8px 0 0 0",
                  }}
                >
                  {monthLabel} · {period}
                </p>

                {/* Fumi logo at bottom */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "80px",
                    left: "0",
                    right: "0",
                    textAlign: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "Playfair Display, Georgia, serif",
                      fontSize: "36px",
                      fontStyle: "italic",
                      color: "#C4703F",
                    }}
                  >
                    fumi.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {canShare && (
            <button
              onClick={handleShare}
              disabled={generating}
              className="flex-1 py-3 rounded-[12px] border-none bg-fumi-accent text-white font-[family-name:var(--font-dm-sans)] text-[13px] font-medium cursor-pointer disabled:opacity-50 transition-opacity"
            >
              {t.shareShare}
            </button>
          )}
          <button
            onClick={handleDownload}
            disabled={generating}
            className={`${canShare ? "flex-1" : "w-full"} py-3 rounded-[12px] border border-fumi-border bg-transparent font-[family-name:var(--font-dm-sans)] text-[13px] text-fumi-text-secondary cursor-pointer disabled:opacity-50 transition-opacity`}
          >
            {t.shareDownload}
          </button>
        </div>

        <button
          onClick={onClose}
          className="py-2 bg-transparent border-none font-[family-name:var(--font-dm-sans)] text-[12px] text-fumi-text-muted cursor-pointer"
        >
          {t.shareClose}
        </button>
      </div>
    </div>
  );
}
