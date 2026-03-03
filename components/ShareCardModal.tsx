"use client";

import { useRef, useState, useCallback } from "react";
import html2canvas from "html2canvas";

interface ShareCardModalProps {
  excerpt: string;
  babyName: string;
  monthLabel: string;
  period: string;
  photos?: string[]; // optional entry photos
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
  photos = [],
  onClose,
  t,
}: ShareCardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Trim excerpt to ~180 chars at word boundary
  const trimmed =
    excerpt.length > 180
      ? excerpt.slice(0, 180).replace(/\s+\S*$/, "") + "…"
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
      handleDownload();
    }
  };

  const canShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  const hasPhoto = !!selectedPhoto;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-fumi-bg rounded-[16px] mx-4 max-w-[380px] w-full p-5 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
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
                  background: hasPhoto
                    ? "#1A1A1A"
                    : "linear-gradient(160deg, #FAF8F5 0%, #F0E8DF 50%, #E8DDD2 100%)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  padding: "0",
                  position: "relative",
                  fontFamily: "serif",
                  overflow: "hidden",
                }}
              >
                {/* ── PHOTO VARIANT ── */}
                {hasPhoto && (
                  <>
                    {/* Full bleed photo */}
                    <img
                      src={selectedPhoto}
                      crossOrigin="anonymous"
                      alt=""
                      style={{
                        position: "absolute",
                        inset: "0",
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        opacity: 0.55,
                      }}
                    />
                    {/* Gradient overlay from bottom */}
                    <div
                      style={{
                        position: "absolute",
                        inset: "0",
                        background: "linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 45%, rgba(0,0,0,0.1) 100%)",
                      }}
                    />
                  </>
                )}

                {/* ── TEXT-ONLY VARIANT: decorative elements ── */}
                {!hasPhoto && (
                  <>
                    {/* Top-left botanical arc */}
                    <svg
                      style={{ position: "absolute", top: "0", left: "0", opacity: 0.08 }}
                      width="400"
                      height="600"
                      viewBox="0 0 400 600"
                      fill="none"
                    >
                      <path d="M-50 600C-50 300 100 100 350 -50" stroke="#C4703F" strokeWidth="1.5" />
                      <path d="M-80 600C-80 320 80 120 330 -30" stroke="#C4703F" strokeWidth="1" />
                      <circle cx="150" cy="200" r="60" stroke="#C4703F" strokeWidth="0.8" />
                      <circle cx="250" cy="100" r="35" stroke="#C4703F" strokeWidth="0.6" />
                      <path d="M100 350C130 300 180 280 220 250" stroke="#C4703F" strokeWidth="0.8" />
                      <path d="M60 450C100 380 160 340 200 300" stroke="#C4703F" strokeWidth="0.6" />
                    </svg>

                    {/* Bottom-right botanical arc */}
                    <svg
                      style={{ position: "absolute", bottom: "0", right: "0", opacity: 0.08 }}
                      width="400"
                      height="500"
                      viewBox="0 0 400 500"
                      fill="none"
                    >
                      <path d="M450 -50C450 200 300 350 50 550" stroke="#C4703F" strokeWidth="1.5" />
                      <path d="M480 -30C480 220 320 370 70 560" stroke="#C4703F" strokeWidth="1" />
                      <circle cx="300" cy="250" r="50" stroke="#C4703F" strokeWidth="0.8" />
                      <circle cx="200" cy="380" r="30" stroke="#C4703F" strokeWidth="0.6" />
                    </svg>

                    {/* Soft watercolor blob top-right */}
                    <div
                      style={{
                        position: "absolute",
                        top: "120px",
                        right: "60px",
                        width: "300px",
                        height: "300px",
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(196,112,63,0.06) 0%, transparent 70%)",
                      }}
                    />

                    {/* Soft watercolor blob bottom-left */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: "200px",
                        left: "40px",
                        width: "250px",
                        height: "250px",
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(196,112,63,0.05) 0%, transparent 70%)",
                      }}
                    />

                    {/* Decorative accent dots top */}
                    <div
                      style={{
                        position: "absolute",
                        top: "100px",
                        left: "0",
                        right: "0",
                        display: "flex",
                        justifyContent: "center",
                        gap: "20px",
                      }}
                    >
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          style={{
                            width: i === 2 ? "12px" : "8px",
                            height: i === 2 ? "12px" : "8px",
                            borderRadius: "50%",
                            backgroundColor: "#C4703F",
                            opacity: i === 2 ? 0.4 : 0.15,
                          }}
                        />
                      ))}
                    </div>

                    {/* Thin horizontal lines decoration */}
                    <div
                      style={{
                        position: "absolute",
                        top: "160px",
                        left: "100px",
                        right: "100px",
                        height: "1px",
                        background: "linear-gradient(90deg, transparent 0%, rgba(196,112,63,0.12) 30%, rgba(196,112,63,0.12) 70%, transparent 100%)",
                      }}
                    />
                  </>
                )}

                {/* ── CONTENT (both variants) ── */}
                <div
                  style={{
                    position: "relative",
                    zIndex: 2,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: hasPhoto ? "0 100px 180px" : "0 100px",
                    marginBottom: hasPhoto ? "0" : "0",
                    flex: hasPhoto ? "none" : "1",
                    justifyContent: hasPhoto ? "flex-end" : "center",
                    width: "100%",
                  }}
                >
                  {/* Opening quotation mark */}
                  <div
                    style={{
                      fontFamily: "Playfair Display, Georgia, serif",
                      fontSize: "180px",
                      color: hasPhoto ? "rgba(255,255,255,0.25)" : "#C4703F",
                      opacity: hasPhoto ? 1 : 0.2,
                      lineHeight: "0.5",
                      marginBottom: "30px",
                      alignSelf: "flex-start",
                    }}
                  >
                    &ldquo;
                  </div>

                  {/* Excerpt text */}
                  <p
                    style={{
                      fontFamily: "Playfair Display, Georgia, serif",
                      fontSize: "50px",
                      lineHeight: "1.55",
                      color: hasPhoto ? "#FFFFFF" : "#1A1A1A",
                      textAlign: "center",
                      fontStyle: "italic",
                      margin: "0",
                      maxWidth: "880px",
                    }}
                  >
                    {trimmed}
                  </p>

                  {/* Divider */}
                  <div
                    style={{
                      width: "60px",
                      height: "2px",
                      backgroundColor: hasPhoto ? "rgba(255,255,255,0.3)" : "#C4703F",
                      margin: "50px 0 40px",
                      opacity: hasPhoto ? 1 : 0.5,
                    }}
                  />

                  {/* Baby name */}
                  <p
                    style={{
                      fontFamily: "DM Sans, Helvetica, sans-serif",
                      fontSize: "30px",
                      color: hasPhoto ? "rgba(255,255,255,0.8)" : "#7A7267",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      margin: "0",
                    }}
                  >
                    {babyName}
                  </p>

                  {/* Month + period */}
                  <p
                    style={{
                      fontFamily: "DM Sans, Helvetica, sans-serif",
                      fontSize: "24px",
                      color: hasPhoto ? "rgba(255,255,255,0.5)" : "#B5ADA3",
                      margin: "8px 0 0 0",
                    }}
                  >
                    {monthLabel} · {period}
                  </p>
                </div>

                {/* Fumi logo at bottom */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "70px",
                    left: "0",
                    right: "0",
                    textAlign: "center",
                    zIndex: 2,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "Playfair Display, Georgia, serif",
                      fontSize: "34px",
                      fontStyle: "italic",
                      color: hasPhoto ? "rgba(255,255,255,0.4)" : "#C4703F",
                      opacity: hasPhoto ? 1 : 0.6,
                    }}
                  >
                    fumi.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Photo picker (if photos available) */}
        {photos.length > 0 && (
          <div>
            <p className="font-[family-name:var(--font-dm-sans)] text-[11px] uppercase tracking-[0.1em] text-fumi-text-muted m-0 mb-2 text-center">
              {selectedPhoto ? "Tap to remove photo" : "Add a photo (optional)"}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 justify-center">
              {photos.slice(0, 6).map((url, i) => (
                <button
                  key={i}
                  onClick={() =>
                    setSelectedPhoto(selectedPhoto === url ? null : url)
                  }
                  className={`flex-shrink-0 w-[52px] h-[52px] rounded-[10px] overflow-hidden border-2 cursor-pointer p-0 transition-all ${
                    selectedPhoto === url
                      ? "border-fumi-accent scale-105"
                      : "border-fumi-border opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

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
