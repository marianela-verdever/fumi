import { NextRequest, NextResponse } from "next/server";

/* ------------------------------------------------------------------ */
/*  Keyword → response-group mapping                                  */
/* ------------------------------------------------------------------ */
const keywordMap: Array<{ keys: string[]; group: string }> = [
  { keys: ["dormir", "sueño", "noche", "sleep", "night", "nap", "siesta"], group: "sleep" },
  { keys: ["comer", "leche", "teta", "pecho", "eat", "feed", "milk", "bottle", "biberon"], group: "feed" },
  { keys: ["sonri", "risa", "reír", "smile", "laugh", "grin"], group: "smile" },
  { keys: ["llorar", "llanto", "cry", "fuss", "colic", "cólico"], group: "cry" },
  { keys: ["caminar", "gatear", "pasos", "walk", "crawl", "step", "stand"], group: "motor" },
  { keys: ["hablar", "palabra", "balbuc", "talk", "word", "babbl", "sound", "voice", "voz"], group: "language" },
  { keys: ["médico", "doctor", "vacuna", "salud", "health", "vaccine", "checkup"], group: "health" },
  { keys: ["familia", "abuel", "tío", "family", "grand", "uncle", "aunt"], group: "family" },
  { keys: ["primero", "primera vez", "first", "nuevo", "new"], group: "first" },
  { keys: ["foto", "photo", "video", "imagen", "image", "picture"], group: "photo" },
];

/* ------------------------------------------------------------------ */
/*  Response pools – ES + EN, 2-3 per group                           */
/* ------------------------------------------------------------------ */
const responsesES: Record<string, string[]> = {
  sleep: [
    "Los patrones de sueño cambian mucho en los primeros meses. ¿{babyName} ya tiene una rutina para dormir?",
    "¿Cómo son las noches con {babyName}? Los despertares nocturnos pueden ser agotadores, pero también momentos únicos de conexión.",
    "Dormir de corrido es un hito enorme. ¿Querés que lo incluyamos en el próximo capítulo?",
  ],
  feed: [
    "La alimentación es un tema gigante en los primeros meses. ¿Cómo va la lactancia o el biberón con {babyName}?",
    "¿{babyName} ya probó algún alimento sólido? Esos primeros sabores suelen ser momentos muy graciosos de capturar.",
    "Las tomas nocturnas son agotadoras pero también íntimas. ¿Hay algún momento de esas noches que quieras guardar?",
  ],
  smile: [
    "¡La primera sonrisa social es un momento mágico! ¿Te acordás qué estabas haciendo cuando pasó?",
    "La risa de un bebé cambia todo. ¿Qué le hace reír a {babyName}?",
    "Esos momentos de alegría son oro puro para el libro. ¿Querés contarme más detalles?",
  ],
  cry: [
    "El llanto es la primera forma de comunicación. ¿Ya distinguís los diferentes llantos de {babyName}?",
    "Los cólicos pueden ser muy difíciles. ¿Cómo lo están manejando? A veces ayuda escribir sobre esos momentos.",
    "Llorar antes de las doce es casi una tradición. ¿Querés que lo cuente con humor en el capítulo?",
  ],
  motor: [
    "¡Los hitos motores son tan emocionantes! ¿{babyName} ya se da vuelta solita?",
    "El gateo cambia todo — de repente nada es seguro. ¿Cómo fue esa primera vez?",
    "Esos primeros pasos tambaleantes son inolvidables. Contame cómo fue, con todos los detalles.",
  ],
  language: [
    "Los primeros sonidos son un idioma propio. ¿{babyName} ya tiene alguna 'palabra' favorita?",
    "El balbuceo es precursor del lenguaje. ¿Qué sonidos te llaman más la atención?",
    "Me encanta cuando inventan sílabas. ¿Hay algún sonido que {babyName} repita mucho?",
  ],
  health: [
    "Las visitas al pediatra son momentos importantes. ¿Cómo fue la última revisión de {babyName}?",
    "Las vacunas no son fáciles para nadie. ¿Querés anotar cómo fue la experiencia?",
    "La salud de {babyName} es lo primero. ¿Hay algo que quieras recordar de este tema?",
  ],
  family: [
    "Las relaciones familiares crecen con {babyName}. ¿Cómo reaccionan los abuelos cuando la ven?",
    "Los momentos en familia son los mejores para el libro. ¿Hay alguna reunión familiar reciente que quieras guardar?",
    "¿{babyName} tiene una conexión especial con alguien de la familia? Esos vínculos son preciosos.",
  ],
  first: [
    "¡Las primeras veces son los mejores capítulos! ¿Qué 'primera vez' querés guardar?",
    "Cada primera vez es un pequeño hito. ¿Cómo te sentiste vos en ese momento?",
    "Las primeras veces pasan rapidísimo. Qué bueno que la estás documentando. Contame más.",
  ],
  photo: [
    "Las fotos y los textos juntos hacen la mejor combinación. ¿Querés subir una imagen para acompañar la historia?",
    "A veces una foto cuenta más que mil palabras. ¿Tenés alguna de ese momento?",
  ],
  fallback: [
    "Contame más sobre {babyName}. ¿Qué momento de esta semana querés recordar?",
    "¿Hay algo de estos días que no quieras olvidar? A veces los detalles pequeños son los que más importan después.",
    "¿Cómo te sentís vos con todo esto? Tu experiencia también es parte de la historia.",
    "Qué lindo momento. ¿Querés que lo incluya en el próximo capítulo?",
  ],
};

const responsesEN: Record<string, string[]> = {
  sleep: [
    "Sleep patterns change so much in the first months. Does {babyName} have a bedtime routine yet?",
    "How are the nights going with {babyName}? Night wakings are exhausting, but also unique moments of connection.",
    "Sleeping through the night is a huge milestone. Want me to include it in the next chapter?",
  ],
  feed: [
    "Feeding is such a big part of the early months. How is breastfeeding or bottle-feeding going with {babyName}?",
    "Has {babyName} tried any solid food yet? Those first tastes are usually hilarious moments to capture.",
    "Night feeds are exhausting but also intimate. Is there a moment from those nights you want to keep?",
  ],
  smile: [
    "The first social smile is such a magical moment! Do you remember what you were doing when it happened?",
    "A baby's laugh changes everything. What makes {babyName} laugh?",
    "Those moments of joy are pure gold for the book. Want to tell me more details?",
  ],
  cry: [
    "Crying is the first form of communication. Can you already tell {babyName}'s different cries apart?",
    "Colic can be really tough. How are you handling it? Sometimes writing about those moments helps.",
    "Crying before midnight is almost a tradition. Want me to tell it with humor in the chapter?",
  ],
  motor: [
    "Motor milestones are so exciting! Can {babyName} roll over on their own yet?",
    "Crawling changes everything — suddenly nothing is safe. How was that first time?",
    "Those first wobbly steps are unforgettable. Tell me how it went, with all the details.",
  ],
  language: [
    "Those first sounds are a language of their own. Does {babyName} have a favorite 'word' yet?",
    "Babbling is the precursor to language. What sounds catch your attention the most?",
    "I love when they invent syllables. Is there a sound {babyName} keeps repeating?",
  ],
  health: [
    "Pediatric visits are important moments. How did {babyName}'s last checkup go?",
    "Vaccines aren't easy for anyone. Want to note down how the experience was?",
    "{babyName}'s health comes first. Is there anything about this you want to remember?",
  ],
  family: [
    "Family bonds grow with {babyName}. How do the grandparents react when they see her?",
    "Family moments are the best for the book. Any recent family gathering you want to save?",
    "Does {babyName} have a special connection with someone in the family? Those bonds are precious.",
  ],
  first: [
    "First times make the best chapters! What 'first time' do you want to save?",
    "Every first time is a little milestone. How did you feel in that moment?",
    "First times go by so fast. I'm glad you're documenting it. Tell me more.",
  ],
  photo: [
    "Photos and text together make the best combination. Want to upload an image to go with the story?",
    "Sometimes a photo says more than a thousand words. Do you have one from that moment?",
  ],
  fallback: [
    "Tell me more about {babyName}. What moment from this week do you want to remember?",
    "Is there anything from these days you don't want to forget? Sometimes the small details matter the most later.",
    "How are you feeling with all of this? Your experience is also part of the story.",
    "What a lovely moment. Want me to include it in the next chapter?",
  ],
};

/* ------------------------------------------------------------------ */
/*  POST handler                                                      */
/* ------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  const { message, babyName, lang } = (await req.json()) as {
    message: string;
    history: unknown[];
    babyName: string;
    lang: "en" | "es";
  };

  // Simulate 1-2 s delay
  await new Promise((r) => setTimeout(r, 1000 + Math.random() * 1000));

  const lower = message.toLowerCase();
  const pool = lang === "en" ? responsesEN : responsesES;

  let group = "fallback";
  for (const { keys, group: g } of keywordMap) {
    if (keys.some((k) => lower.includes(k))) {
      group = g;
      break;
    }
  }

  const options = pool[group] ?? pool.fallback;
  const reply = options[Math.floor(Math.random() * options.length)].replace(
    /\{babyName\}/g,
    babyName
  );

  return NextResponse.json({ reply });
}
