import { NextRequest, NextResponse } from "next/server";
import { voiceDrafts } from "@/lib/sample-data";
import type { Voice } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  EN voice drafts (sample-data only has ES)                         */
/* ------------------------------------------------------------------ */
const voiceDraftsEN: Record<Voice, string> = {
  yo: `The first Christmas Eve had it all: presents, crying right before midnight, and video calls with Buenos Aires past two in the morning. New Year's Eve went better. She ate, let me eat, and slept through the night. The best New Year's gift imaginable.

In January she started experimenting with her voice. On top of "agoo" came syllables that sounded like inventions from another planet — "eglu," for example. They told her she needed more tummy time. She made it clear she disagreed. She grabbed a muslin cloth and tasted it like it was fine dining.

On January 17th, the three of us went to a café for the first time. And the next day she met Dana — three months older. The first time she saw she wasn't the only one.`,

  nosotros: `The first Christmas Eve, she won us over. There were presents, there was crying right before midnight — hers, not ours, though it was close. At two in the morning we video-called the family in Buenos Aires. By New Year's Eve we were a more seasoned team. She ate, let us eat, and slept through the whole night. It was the first time. We started the year not knowing what sleep was, and she gave it back to us as a gift.

In January she started inventing a language. On top of "agoo" came "eglu" and other syllables that left us watching her in fascination. They told her she needed more tummy time. She disagreed. She grabbed a muslin cloth and investigated it thoroughly.

On January 17th the three of us went to a café. Our first real outing. The next day she met Dana, and they looked at each other like two explorers crossing paths in unknown territory.`,

  baby: `My first Christmas Eve was pretty confusing. There were colorful papers everywhere, excited people, and I decided the best time to share my opinion was right before midnight. At two in the morning they introduced me to some people through a screen who apparently live far away and love me very much.

By New Year's Eve I had more experience. I ate, let them eat, and slept the whole night through. My parents couldn't seem to believe it. You're welcome.

In January I started experimenting with my voice. I discovered that if I move my tongue a certain way, out comes "eglu." It's my word. I don't know what it means, but I like how it sounds.

They told me I need to spend more time on my tummy. I considered it and decided no. I put a muslin cloth in my mouth to settle the discussion. It tasted pretty good.

On January 17th the three of us went to a café. My first café. Well, theirs. I slept. And the next day I met Dana, who is three months older than me. It's the first time I saw another human my size. Interesting.`,
};

/* ------------------------------------------------------------------ */
/*  Empty-chapter placeholders                                        */
/* ------------------------------------------------------------------ */
const emptyPlaceholders: Record<string, Record<Voice, string>> = {
  es: {
    yo: "Este mes todavía no tiene muchas entradas. Agregá momentos y voy a escribir tu historia.",
    nosotros:
      "Todavía no hay suficientes momentos para este mes. Vamos sumando y armamos el capítulo juntos.",
    baby: "Todavía no tengo muchas historias de este mes. ¡Seguí agregando momentos!",
  },
  en: {
    yo: "This month doesn't have many entries yet. Add some moments and I'll write your story.",
    nosotros:
      "There aren't enough moments for this month yet. Let's keep adding and we'll build the chapter together.",
    baby: "I don't have many stories from this month yet. Keep adding moments!",
  },
};

/* ------------------------------------------------------------------ */
/*  POST handler                                                      */
/* ------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    entries,
    voice,
    babyName,
    instruction,
    currentContent,
    lang,
  } = body as {
    entries: unknown[];
    voice: Voice;
    month: number;
    babyName: string;
    instruction?: string;
    currentContent?: string;
    lang: "en" | "es";
  };

  // Simulate 2–3 s generation delay
  await new Promise((r) => setTimeout(r, 2000 + Math.random() * 1000));

  // ── Case 1: No entries → short placeholder ─────────────────────────
  if (!entries || entries.length === 0) {
    // If there is current content already, fall through to case 2/3
    if (!currentContent && !instruction) {
      const content = (emptyPlaceholders[lang]?.[voice] ?? emptyPlaceholders.en[voice]).replace(
        /\{babyName\}/g,
        babyName
      );
      return NextResponse.json({ content });
    }
  }

  // ── Case 2: Instruction-based regeneration ─────────────────────────
  if (instruction && currentContent) {
    const lower = instruction.toLowerCase();
    let content = currentContent;

    if (
      ["corto", "short", "shorter", "más corto", "breve", "brief"].some((k) =>
        lower.includes(k)
      )
    ) {
      // Shorten: keep first half of paragraphs (min 2)
      const paras = currentContent.split("\n\n");
      content = paras
        .slice(0, Math.max(2, Math.ceil(paras.length / 2)))
        .join("\n\n");
    } else if (
      ["largo", "long", "longer", "expand", "más largo", "extender"].some((k) =>
        lower.includes(k)
      )
    ) {
      // Lengthen: append a new closing paragraph
      const extra =
        lang === "es"
          ? `\n\nY así, entre un descubrimiento y otro, ${babyName} seguía creciendo — un poco más cada día, a su propio ritmo, dejando pequeñas huellas en nuestra historia.`
          : `\n\nAnd so, between one discovery and the next, ${babyName} kept growing — a little more each day, at their own pace, leaving small footprints in our story.`;
      content = currentContent + extra;
    } else if (
      ["tono", "tone", "formal", "poetic", "poético"].some((k) =>
        lower.includes(k)
      )
    ) {
      // Tone shift: slightly rewrite first paragraph
      const paras = currentContent.split("\n\n");
      const prefix =
        lang === "es"
          ? "Con la mirada puesta en cada pequeño instante, "
          : "With eyes set on every small moment, ";
      paras[0] = prefix + paras[0].charAt(0).toLowerCase() + paras[0].slice(1);
      content = paras.join("\n\n");
    } else {
      // Generic revision: tweak last paragraph
      const paras = currentContent.split("\n\n");
      const suffix =
        lang === "es"
          ? " Y quizás eso sea lo más importante de todo."
          : " And perhaps that's the most important thing of all.";
      paras[paras.length - 1] = paras[paras.length - 1] + suffix;
      content = paras.join("\n\n");
    }

    return NextResponse.json({ content });
  }

  // ── Case 3: Full generation from entries ───────────────────────────
  const drafts = lang === "en" ? voiceDraftsEN : voiceDrafts;
  const content = (drafts[voice] ?? drafts.baby).replace(
    /\{babyName\}/g,
    babyName
  );

  return NextResponse.json({ content });
}
