"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
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
    shareAddPhoto: string;
    shareTapRemove: string;
    shareEditHint: string;
  };
}

/** Trim text at the last sentence boundary before maxLen, or word boundary as fallback */
function smartTrim(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;

  const chunk = text.slice(0, maxLen);
  // Find last sentence-ending punctuation
  const lastSentence = Math.max(
    chunk.lastIndexOf(". "),
    chunk.lastIndexOf("! "),
    chunk.lastIndexOf("? "),
    chunk.lastIndexOf(".\n"),
    chunk.lastIndexOf(".\u00A0"), // non-breaking space
  );

  if (lastSentence > maxLen * 0.4) {
    // Found a sentence boundary in the second half — use it
    return text.slice(0, lastSentence + 1);
  }

  // Fallback: trim at last word boundary
  return chunk.replace(/\s+\S*$/, "") + "…";
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
  const [mounted, setMounted] = useState(false);
  const [editingText, setEditingText] = useState(false);
  const [customText, setCustomText] = useState(() => smartTrim(excerpt, 180));

  // Mount check for portal (SSR safety)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // The display text (what shows on the card)
  const displayText = customText || smartTrim(excerpt, 180);

  const generateImage = useCallback(async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    setGenerating(true);
    try {
      // Use lower scale on mobile to avoid memory issues
      const isMobile = window.innerWidth < 640;
      const canvas = await html2canvas(cardRef.current, {
        scale: isMobile ? 1.5 : 2,
        backgroundColor: null,
        useCORS: true,
        logging: false,
      });
      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), "image/png", 1.0);
      });
    } catch {
      return null;
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
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const blob = await generateImage();
    if (!blob) {
      // Fallback if image generation fails
      handleDownload();
      return;
    }
    const file = new File([blob], `fumi-${babyName.toLowerCase()}.png`, {
      type: "image/png",
    });

    // Try sharing with file
    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `fumi. — ${babyName}`,
        });
        return;
      }
    } catch (err: unknown) {
      // AbortError = user cancelled — that's fine
      if (err instanceof Error && err.name === "AbortError") return;
    }

    // Fallback: try sharing without file (just text)
    try {
      if (navigator.share) {
        await navigator.share({
          title: `fumi. — ${babyName}`,
          text: displayText,
        });
        return;
      }
    } catch {
      // ignore
    }

    // Final fallback: download
    handleDownload();
  };

  const canShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  const hasPhoto = !!selectedPhoto;

  const modalContent = (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-fumi-bg rounded-t-[16px] sm:rounded-[16px] mx-0 sm:mx-4 max-w-[380px] w-full flex flex-col max-h-[85vh] sm:max-h-[92vh] mb-0 sm:mb-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Scrollable content area */}
        <div
          className="flex-1 overflow-y-auto p-5 pb-3 flex flex-col gap-4"
          style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}
        >
          <p className="font-[family-name:var(--font-dm-sans)] text-[14px] text-fumi-text font-medium m-0 text-center">
            {t.shareTitle}
          </p>

          {/* Card preview (scaled down for display) */}
          <div className="flex justify-center">
            <div className="w-[220px] h-[391px] overflow-hidden rounded-[12px] shadow-lg flex-shrink-0">
              <div
                style={{
                  transform: "scale(0.2037)",
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
                    {displayText}
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

          {/* Editable excerpt */}
          {editingText ? (
            <div className="px-4">
              <textarea
                value={customText}
                onChange={(e) => {
                  // Cap at 200 chars to fit the card
                  if (e.target.value.length <= 200) setCustomText(e.target.value);
                }}
                rows={3}
                className="w-full bg-white border border-fumi-border rounded-[10px] px-3 py-2.5 font-[family-name:var(--font-dm-sans)] text-[13px] text-fumi-text outline-none focus:border-fumi-accent transition-colors resize-none"
                autoFocus
              />
              <div className="flex justify-between items-center mt-1 mb-2">
                <span className="font-[family-name:var(--font-dm-sans)] text-[10px] text-fumi-text-muted">
                  {customText.length}/200
                </span>
                <button
                  onClick={() => setEditingText(false)}
                  className="font-[family-name:var(--font-dm-sans)] text-[11px] text-fumi-accent bg-transparent border-none cursor-pointer"
                >
                  OK
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setEditingText(true)}
              className="mx-4 mb-1 py-2 bg-transparent border border-dashed border-fumi-border rounded-[10px] font-[family-name:var(--font-dm-sans)] text-[11px] text-fumi-text-muted cursor-pointer hover:border-fumi-accent/40 transition-colors"
            >
              {t.shareEditHint} ✎
            </button>
          )}

          {/* Photo picker (if photos available) */}
          {photos.length > 0 && (
            <div>
              <p className="font-[family-name:var(--font-dm-sans)] text-[11px] uppercase tracking-[0.1em] text-fumi-text-muted m-0 mb-2 text-center">
                {selectedPhoto ? t.shareTapRemove : t.shareAddPhoto}
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
        </div>

        {/* Action buttons — pinned at bottom, never hidden */}
        <div className="px-5 pb-20 sm:pb-5 pt-3 flex flex-col gap-2 border-t border-fumi-border/30 flex-shrink-0 safe-area-bottom">
          <div className="flex gap-2">
            {canShare && (
              <button
                onClick={handleShare}
                disabled={generating}
                className="flex-1 py-3 rounded-[12px] border-none bg-fumi-accent text-white font-[family-name:var(--font-dm-sans)] text-[13px] font-medium cursor-pointer disabled:opacity-50 transition-opacity"
              >
                {generating ? "..." : t.shareShare}
              </button>
            )}
            <button
              onClick={handleDownload}
              disabled={generating}
              className={`${canShare ? "flex-1" : "w-full"} py-3 rounded-[12px] border border-fumi-border bg-transparent font-[family-name:var(--font-dm-sans)] text-[13px] text-fumi-text-secondary cursor-pointer disabled:opacity-50 transition-opacity`}
            >
              {generating ? "..." : t.shareDownload}
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
    </div>
  );

  // Render via portal to escape AppShell stacking context
  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}
