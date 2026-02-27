import { NextRequest, NextResponse } from "next/server";

/* ------------------------------------------------------------------ */
/*  Preset transcriptions – 5 per language                            */
/* ------------------------------------------------------------------ */
const transcriptionsES = [
  "Hoy a la mañana se quedó mirando sus manos como diez minutos, fascinada, moviendo los dedos. Fue muy lindo de ver.",
  "Anoche durmió toda la noche de corrido. No lo puedo creer, estoy emocionada.",
  "Le cantamos una canción y se rió por primera vez. Fue un momento mágico, los tres juntos.",
  "Hoy conoció a su abuela por videollamada. Se quedó mirando la pantalla con los ojos enormes.",
  "Descubrió que puede agarrar cosas con la mano. Agarró mi dedo y no lo soltó por media hora.",
];

const transcriptionsEN = [
  "This morning she spent ten minutes staring at her hands, fascinated, wiggling her fingers. It was so beautiful to watch.",
  "Last night she slept through the entire night. I can't believe it, I'm so happy.",
  "We sang her a song and she laughed for the first time. It was a magical moment, the three of us together.",
  "Today she met her grandmother on a video call. She stared at the screen with huge eyes.",
  "She discovered she can grab things with her hand. She held my finger and didn't let go for half an hour.",
];

/* ------------------------------------------------------------------ */
/*  POST handler                                                      */
/* ------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  // Accept FormData (audio blob will be ignored in mock)
  const formData = await req.formData();
  const lang = (formData.get("lang") as string) || "es";

  // Simulate 2 s transcription delay
  await new Promise((r) => setTimeout(r, 2000));

  const pool = lang === "en" ? transcriptionsEN : transcriptionsES;
  const text = pool[Math.floor(Math.random() * pool.length)];

  return NextResponse.json({ text });
}
