import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { Voice } from "@/lib/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/* ------------------------------------------------------------------ */
/*  Voice descriptions for the system prompt                           */
/* ------------------------------------------------------------------ */
const voiceDescriptions: Record<Voice, Record<string, string>> = {
  yo: {
    es: 'Escribe en primera persona desde la perspectiva de la madre/padre ("yo"). Tono íntimo, reflexivo, literario. Como un diario personal que se convertirá en libro.',
    en: 'Write in first person from the parent\'s perspective ("I"). Intimate, reflective, literary tone. Like a personal diary that will become a book.',
  },
  nosotros: {
    es: 'Escribe en primera persona del plural ("nosotros"), desde la perspectiva de ambos padres. Tono cálido, cómplice, como una historia compartida.',
    en: 'Write in first person plural ("we"), from both parents\' perspective. Warm, shared tone, like a story told together.',
  },
  baby: {
    es: `Escribe en primera persona desde la perspectiva del bebé. El bebé "narra" su propia historia con humor, ternura y una mirada curiosa del mundo. Usa un tono ingenioso pero no infantilizado — como si el bebé tuviera conciencia y opiniones propias.`,
    en: `Write in first person from the baby's perspective. The baby "narrates" their own story with humor, tenderness, and a curious view of the world. Use a witty but not infantilized tone — as if the baby had awareness and their own opinions.`,
  },
};

/* ------------------------------------------------------------------ */
/*  System prompts                                                     */
/* ------------------------------------------------------------------ */
function buildSystemPrompt(voice: Voice, babyName: string, lang: string): string {
  const voiceDesc = voiceDescriptions[voice]?.[lang] ?? voiceDescriptions[voice]?.en;

  if (lang === "es") {
    return `Eres un escritor literario que transforma momentos cotidianos de un bebé en capítulos hermosos para un libro.

REGLAS:
- ${voiceDesc}
- El bebé se llama ${babyName}.
- Cada capítulo cubre aproximadamente un mes de vida.
- Usa los momentos/entradas que te doy como base, pero teje una narrativa fluida — no una lista.
- Incluye detalles sensoriales y emocionales.
- Tono: literario, cálido, con toques de humor cuando corresponda.
- NO uses emojis, hashtags, ni encabezados.
- Escribe entre 3 y 6 párrafos.
- Usa español neutro, comprensible en cualquier país hispanohablante. Usa "tú" en lugar de "vos". Evita regionalismos marcados.`;
  }

  return `You are a literary writer who transforms everyday baby moments into beautiful book chapters.

RULES:
- ${voiceDesc}
- The baby's name is ${babyName}.
- Each chapter covers roughly one month of life.
- Use the moments/entries I give you as a foundation, but weave a fluid narrative — not a list.
- Include sensory and emotional details.
- Tone: literary, warm, with touches of humor where appropriate.
- Do NOT use emojis, hashtags, or headings.
- Write between 3 and 6 paragraphs.`;
}

/* ------------------------------------------------------------------ */
/*  POST handler                                                      */
/* ------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      entries,
      voice,
      babyName,
      instruction,
      currentContent,
      lang,
    } = body as {
      entries: Array<{ date: string; content: string; type: string; tags?: string[] }>;
      voice: Voice;
      month: number;
      babyName: string;
      instruction?: string;
      currentContent?: string;
      lang: "en" | "es";
    };

    // ── Case 1: No entries and no current content → short placeholder ──
    if ((!entries || entries.length === 0) && !currentContent && !instruction) {
      const placeholders: Record<string, Record<Voice, string>> = {
        es: {
          yo: "Este mes todavía no tiene muchas entradas. Agregá momentos y voy a escribir tu historia.",
          nosotros: "Todavía no hay suficientes momentos para este mes. Vamos sumando y armamos el capítulo juntos.",
          baby: "Todavía no tengo muchas historias de este mes. ¡Seguí agregando momentos!",
        },
        en: {
          yo: "This month doesn't have many entries yet. Add some moments and I'll write your story.",
          nosotros: "There aren't enough moments for this month yet. Let's keep adding and we'll build the chapter together.",
          baby: "I don't have many stories from this month yet. Keep adding moments!",
        },
      };
      const content = placeholders[lang]?.[voice] ?? placeholders.en[voice];
      return NextResponse.json({ content });
    }

    const systemPrompt = buildSystemPrompt(voice, babyName, lang);

    // ── Case 2: Instruction-based regeneration ─────────────────────────
    if (instruction && currentContent) {
      const userPrompt =
        lang === "es"
          ? `Este es el capítulo actual:\n\n${currentContent}\n\nEl usuario quiere este cambio: "${instruction}"\n\nReescribí el capítulo aplicando el cambio pedido. Mantené la misma voz y estilo. Devolvé SOLO el texto del capítulo, sin explicaciones.`
          : `This is the current chapter:\n\n${currentContent}\n\nThe user wants this change: "${instruction}"\n\nRewrite the chapter applying the requested change. Keep the same voice and style. Return ONLY the chapter text, no explanations.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 1500,
        temperature: 0.7,
      });

      const content = completion.choices[0]?.message?.content?.trim() ?? currentContent;
      return NextResponse.json({ content });
    }

    // ── Case 3: Full generation from entries ───────────────────────────
    const entriesSummary = entries
      .map((e) => {
        const tags = e.tags?.length ? ` [${e.tags.join(", ")}]` : "";
        return `- ${e.date}: ${e.content}${tags}`;
      })
      .join("\n");

    const userPrompt =
      lang === "es"
        ? `Estos son los momentos registrados este mes:\n\n${entriesSummary}\n\nEscribí un capítulo narrativo basado en estos momentos. Devolvé SOLO el texto del capítulo, sin títulos ni explicaciones.`
        : `These are the recorded moments from this month:\n\n${entriesSummary}\n\nWrite a narrative chapter based on these moments. Return ONLY the chapter text, no titles or explanations.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 1500,
      temperature: 0.8,
    });

    const content =
      completion.choices[0]?.message?.content?.trim() ??
      (lang === "es"
        ? "No pude generar el capítulo. Intentá de nuevo."
        : "I couldn't generate the chapter. Please try again.");

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Chapter generation error:", error);
    return NextResponse.json(
      {
        content: "Error generating chapter. Please try again.",
      },
      { status: 500 }
    );
  }
}
