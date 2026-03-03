import { NextRequest, NextResponse } from "next/server";
import { jsPDF } from "jspdf";

/* ------------------------------------------------------------------ */
/*  Theme constants                                                   */
/* ------------------------------------------------------------------ */
const C = {
  bg: [250, 248, 245] as [number, number, number],
  coverBg: [42, 37, 32] as [number, number, number],
  text: [26, 26, 26] as [number, number, number],
  textMuted: [181, 173, 163] as [number, number, number],
  accent: [196, 112, 63] as [number, number, number],
  accentSoft: [232, 213, 196] as [number, number, number],
  success: [122, 158, 126] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */
interface OwnBlock {
  id: string;
  text: string;
  afterParagraph: number;
}

interface ChapterData {
  month: number;
  period: string;
  status: string;
  voice: string;
  generatedContent: string;
  ownTextBlocks: OwnBlock[];
  photoUrls?: string[];
}

interface ExportRequest {
  babyName: string;
  birthYear: string;
  chapters: ChapterData[];
  lang: "en" | "es";
}

/* ------------------------------------------------------------------ */
/*  Helper: word-wrap text into lines that fit within maxWidth         */
/* ------------------------------------------------------------------ */
function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth) as string[];
}

/* ------------------------------------------------------------------ */
/*  POST handler                                                      */
/* ------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ExportRequest;
    const { babyName, birthYear, chapters, lang } = body;

    // Filter to chapters with content
    const exportable = chapters.filter(
      (ch) => ch.generatedContent.trim().length > 0
    );

    if (exportable.length === 0) {
      return NextResponse.json(
        {
          error:
            lang === "en"
              ? "No chapters with content to export."
              : "No hay capítulos con contenido para exportar.",
        },
        { status: 400 }
      );
    }

    // A5 size in mm: 148 x 210
    const doc = new jsPDF({ format: "a5", unit: "mm" });
    const W = 148;
    const H = 210;
    const margin = 20;
    const contentWidth = W - margin * 2;

    // ── Cover page ──────────────────────────────────────────────────
    doc.setFillColor(...C.coverBg);
    doc.rect(0, 0, W, H, "F");

    // Brand
    doc.setFont("times", "italic");
    doc.setFontSize(14);
    doc.setTextColor(...C.accent);
    doc.text("fumi.", W / 2, 70, { align: "center" });

    // Baby name
    doc.setFont("times", "normal");
    doc.setFontSize(36);
    doc.setTextColor(...C.accentSoft);
    doc.text(babyName, W / 2, 100, { align: "center" });

    // Year
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(...C.textMuted);
    doc.text(birthYear, W / 2, 115, { align: "center" });

    // Decorative line
    doc.setDrawColor(...C.accent);
    doc.setLineWidth(0.3);
    const lineW = 20;
    doc.line(W / 2 - lineW / 2, 135, W / 2 + lineW / 2, 135);

    // ── Helper: add a new content page with bg + page number ──────
    let pageNum = 1;
    const addContentPage = () => {
      doc.addPage("a5");
      pageNum++;
      doc.setFillColor(...C.bg);
      doc.rect(0, 0, W, H, "F");
      // Page number
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...C.textMuted);
      doc.text(String(pageNum), W / 2, H - 10, { align: "center" });
      return margin + 5;
    };

    // ── Helper: fetch image as base64 data URL ──────────────────
    const fetchImageBase64 = async (url: string): Promise<string | null> => {
      try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const buffer = await res.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        const contentType = res.headers.get("content-type") || "image/jpeg";
        return `data:${contentType};base64,${base64}`;
      } catch {
        return null;
      }
    };

    // ── Chapter pages ───────────────────────────────────────────────
    const monthLabel = lang === "en" ? "Month" : "Mes";

    for (const ch of exportable) {
      let y = addContentPage();

      // Chapter title
      doc.setFont("times", "bold");
      doc.setFontSize(22);
      doc.setTextColor(...C.text);
      doc.text(`${monthLabel} ${ch.month}`, margin, y);
      y += 7;

      // Period
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...C.textMuted);
      doc.text(ch.period.toUpperCase(), margin, y);
      y += 6;

      // Status badge (if approved)
      if (ch.status === "approved") {
        doc.setFontSize(8);
        doc.setTextColor(...C.success);
        const badgeText = lang === "en" ? "Approved" : "Aprobado";
        doc.text(`✓ ${badgeText}`, margin, y);
        y += 5;
      }

      y += 6;

      // Content paragraphs interleaved with own blocks and photos
      const paragraphs = ch.generatedContent
        .split("\n\n")
        .filter((p) => p.trim());
      const blocks = (ch.ownTextBlocks ?? []) as OwnBlock[];
      const photos = ch.photoUrls ?? [];

      // Distribute photos across paragraphs
      const photoMap: Record<number, string[]> = {};
      if (photos.length > 0 && paragraphs.length > 0) {
        const interval = Math.max(1, Math.floor(paragraphs.length / Math.min(photos.length, paragraphs.length)));
        photos.forEach((url, i) => {
          const afterIdx = Math.min(interval * i + (interval - 1), paragraphs.length - 1);
          if (!photoMap[afterIdx]) photoMap[afterIdx] = [];
          photoMap[afterIdx].push(url);
        });
      }

      doc.setFont("times", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(...C.text);
      const lineHeight = 5;

      for (let pi = 0; pi < paragraphs.length; pi++) {
        const lines = wrapText(doc, paragraphs[pi], contentWidth);

        // Check if we need a new page
        const neededSpace = lines.length * lineHeight + 6;
        if (y + neededSpace > H - margin) {
          y = addContentPage();
          doc.setFont("times", "normal");
          doc.setFontSize(10.5);
          doc.setTextColor(...C.text);
        }

        for (const line of lines) {
          doc.text(line, margin, y);
          y += lineHeight;
        }
        y += 4;

        // Photos after this paragraph
        const paragraphPhotos = photoMap[pi];
        if (paragraphPhotos) {
          for (const photoUrl of paragraphPhotos) {
            const imgData = await fetchImageBase64(photoUrl);
            if (imgData) {
              const imgH = 50; // mm height
              if (y + imgH + 4 > H - margin) {
                y = addContentPage();
              }
              try {
                doc.addImage(imgData, "JPEG", margin, y, contentWidth, imgH);
                y += imgH + 6;
              } catch {
                // Skip if image can't be added
              }
              // Reset font after image
              doc.setFont("times", "normal");
              doc.setFontSize(10.5);
              doc.setTextColor(...C.text);
            }
          }
        }

        // Own blocks after this paragraph
        const blocksHere = blocks.filter((b) => b.afterParagraph === pi);
        for (const block of blocksHere) {
          // Left accent bar
          doc.setDrawColor(...C.accentSoft);
          doc.setLineWidth(0.8);

          const blockLines = wrapText(doc, block.text, contentWidth - 8);
          const blockHeight = blockLines.length * lineHeight + 8;

          if (y + blockHeight > H - margin) {
            y = addContentPage();
          }

          doc.line(margin, y - 2, margin, y + blockHeight - 6);

          // Label
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);
          doc.setTextColor(...C.accent);
          doc.text(
            lang === "en" ? "YOUR TEXT" : "TU TEXTO",
            margin + 4,
            y
          );
          y += 4;

          // Block text
          doc.setFont("times", "italic");
          doc.setFontSize(10.5);
          doc.setTextColor(...C.text);
          for (const line of blockLines) {
            doc.text(line, margin + 4, y);
            y += lineHeight;
          }
          y += 5;

          // Reset font for next paragraph
          doc.setFont("times", "normal");
          doc.setFontSize(10.5);
          doc.setTextColor(...C.text);
        }
      }

      // Chapter footer
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...C.textMuted);
      doc.text(`fumi.  ·  ${babyName}`, W / 2, H - 12, {
        align: "center",
      });
    }

    // Generate buffer
    const pdfOutput = doc.output("arraybuffer");

    return new NextResponse(pdfOutput, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${babyName.toLowerCase()}-fumi.pdf"`,
      },
    });
  } catch (err) {
    console.error("PDF generation error:", err);
    return NextResponse.json(
      { error: "PDF generation failed" },
      { status: 500 }
    );
  }
}
