import type { Entry, Chapter, ChatMessage, Voice } from "./types";

export const sampleEntries: Entry[] = [
  {
    id: "1",
    babyId: "1",
    date: "2024-11-14",
    type: "text",
    content: "Aurora llegó al mundo a las 17:44. Afuera ya oscurecía. Adentro, todo empezaba.",
    mediaUrls: [],
    tags: ["primera vez"],
    createdAt: "2024-11-14T17:44:00Z",
    updatedAt: "2024-11-14T17:44:00Z",
  },
  {
    id: "2",
    babyId: "1",
    date: "2024-11-17",
    type: "text",
    content: "Nos fuimos a casa. Somos tres.",
    mediaUrls: [],
    tags: [],
    createdAt: "2024-11-17T12:00:00Z",
    updatedAt: "2024-11-17T12:00:00Z",
  },
  {
    id: "3",
    babyId: "1",
    date: "2024-11-23",
    type: "text",
    content: "Se cayó el cordón. Primer baño.",
    mediaUrls: [],
    tags: ["milestone"],
    createdAt: "2024-11-23T10:00:00Z",
    updatedAt: "2024-11-23T10:00:00Z",
  },
  {
    id: "4",
    babyId: "1",
    date: "2024-12-21",
    type: "photo",
    content: "Descubrió a Pinot. Obsesión inmediata.",
    mediaUrls: ["🐱"],
    tags: [],
    createdAt: "2024-12-21T15:00:00Z",
    updatedAt: "2024-12-21T15:00:00Z",
  },
  {
    id: "5",
    babyId: "1",
    date: "2024-12-24",
    type: "text",
    content: "Primera Nochebuena. Regalos, llanto antes de las doce, videollamadas con Buenos Aires a las dos de la mañana.",
    mediaUrls: [],
    tags: ["primera vez"],
    createdAt: "2024-12-24T23:00:00Z",
    updatedAt: "2024-12-24T23:00:00Z",
  },
  {
    id: "6",
    babyId: "1",
    date: "2024-12-31",
    type: "text",
    content: "Durmió de corrido toda la noche. Desde entonces, todas las noches. El mejor regalo de Año Nuevo posible.",
    mediaUrls: [],
    tags: ["milestone"],
    createdAt: "2024-12-31T08:00:00Z",
    updatedAt: "2024-12-31T08:00:00Z",
  },
  {
    id: "7",
    babyId: "1",
    date: "2025-01-07",
    type: "text",
    content: "Le dijeron que tiene que estar más boca abajo. Ella opina distinto.",
    mediaUrls: [],
    tags: ["gracioso"],
    createdAt: "2025-01-07T14:00:00Z",
    updatedAt: "2025-01-07T14:00:00Z",
  },
  {
    id: "8",
    babyId: "1",
    date: "2025-01-17",
    type: "photo",
    content: "Primera salida a un café. Los tres.",
    mediaUrls: ["☕"],
    tags: ["primera vez"],
    createdAt: "2025-01-17T11:00:00Z",
    updatedAt: "2025-01-17T11:00:00Z",
  },
];

export const sampleConversation: ChatMessage[] = [
  {
    role: "ai",
    text: "Aurora tiene 6 semanas. Muchos bebés a esta edad empiezan a hacer su primera sonrisa social. ¿Ya notaste algo?",
  },
  {
    role: "user",
    text: "Sí! Ayer a la mañana le estaba hablando y me sonrió clarito, mirándome a los ojos.",
  },
  {
    role: "ai",
    text: "Qué momento. ¿Quién más estaba? ¿Te acordás qué le estabas diciendo?",
  },
  {
    role: "user",
    text: "Estábamos solas, yo le cantaba una canción que le canto siempre para cambiarle el pañal, una que me inventé.",
  },
  {
    role: "ai",
    text: 'Eso es hermoso — tiene su propia canción. ¿Querés que incluya esto en el capítulo de mes 2? Podría ir algo como: "La primera sonrisa fue una mañana cualquiera, mientras mamá le cantaba la canción del pañal — esa que inventó para ella y que nadie más conoce."',
  },
];

export const voiceDrafts: Record<Voice, string> = {
  yo: `La primera Nochebuena fue con todo: regalos, llanto justo antes de las doce, y videollamadas con Buenos Aires pasadas las dos de la mañana. Nochevieja le sentó mejor. Comió, me dejó comer, y durmió de corrido. El mejor regalo de Año Nuevo posible.

En enero empezó a experimentar con su voz. Al agú se le sumaron sílabas que sonaban a invenciones de otro planeta — "eglu", por ejemplo. Le dijeron que tenía que pasar más tiempo boca abajo. Ella dejó claro que no estaba de acuerdo. Se llevó una muselina a la boca y la saboreó como si fuera alta cocina.

El 17 de enero salimos los tres a un café por primera vez. Y al día siguiente conoció a Dana — tres meses mayor. La primera vez que vio que no era la única.`,

  nosotros: `La primera Nochebuena nos la hizo ganar. Hubo regalos, hubo llanto justo antes de las doce — el de ella, no el nuestro, aunque faltó poco. A las dos de la mañana hicimos videollamada con la familia en Buenos Aires. Para Nochevieja ya éramos un equipo más rodado. Comió, nos dejó comer, y durmió de corrido. Fue la primera vez. Arrancamos el año sin saber lo que era el sueño, y ella nos lo devolvió como regalo.

En enero empezó a inventar un idioma. Al agú le sumó "eglu" y otras sílabas que nos dejaban mirándola fascinados. Le dijeron que tenía que estar más boca abajo. Opinó distinto. Se llevó una muselina a la boca y la investigó a fondo.

El 17 de enero salimos los tres a un café. Nuestra primera salida de verdad. Al día siguiente conoció a Dana, y se miraron como dos exploradores que se cruzan en territorio desconocido.`,

  baby: `Mi primera Nochebuena fue bastante confusa. Había papeles de colores por todos lados, gente emocionada, y yo decidí que el mejor momento para opinar era justo antes de las doce. A las dos de la mañana me presentaron a unas personas por una pantalla que al parecer viven muy lejos y me quieren mucho.

Para Nochevieja ya tenía más experiencia. Comí, dejé comer, y dormí toda la noche de un tirón. Mis padres parecían no poder creerlo. De nada.

En enero empecé a experimentar con mi voz. Descubrí que si muevo la lengua de cierta forma sale "eglu". Es mi palabra. No sé qué significa, pero me gusta cómo suena.

Me dijeron que tengo que pasar más tiempo boca abajo. Lo consideré y decidí que no. Me llevé una muselina a la boca para zanjar la discusión. Sabía bastante bien.

El 17 de enero salimos los tres a un café. Mi primer café. Bueno, el de ellos. Yo dormí. Y al día siguiente conocí a Dana, que tiene tres meses más que yo. Es la primera vez que vi a otro humano de mi tamaño. Interesante.`,
};

export const sampleChapters: Chapter[] = [
  {
    id: "ch1",
    babyId: "1",
    month: 1,
    period: "Nov — Dic 2024",
    status: "approved",
    voice: "baby",
    generatedContent: voiceDrafts.baby,
    ownTextBlocks: [],
    entryIds: ["1", "2", "3", "4", "5", "6"],
    createdAt: "2024-12-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
  {
    id: "ch2",
    babyId: "1",
    month: 2,
    period: "Dic 2024 — Ene 2025",
    status: "draft",
    voice: "baby",
    generatedContent: "",
    ownTextBlocks: [],
    entryIds: ["5", "6", "7", "8"],
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-02-01T00:00:00Z",
  },
  {
    id: "ch3",
    babyId: "1",
    month: 3,
    period: "Ene — Feb 2025",
    status: "collecting",
    voice: "baby",
    generatedContent: "",
    ownTextBlocks: [],
    entryIds: ["7", "8"],
    createdAt: "2025-02-01T00:00:00Z",
    updatedAt: "2025-02-27T00:00:00Z",
  },
];

export const placeholders = [
  "¿Qué recuerdo querés guardar?",
  "Contame algo que no quieras olvidar...",
  "¿Qué pasó que te hizo sonreír?",
  "Algo que hizo, algo que dijiste, algo que sentiste...",
];

export const placeholdersEN = [
  "What moment do you want to keep?",
  "Tell me something you don't want to forget...",
  "What happened that made you smile?",
  "Something they did, something you said, something you felt...",
];
