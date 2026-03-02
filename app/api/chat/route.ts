import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/* ------------------------------------------------------------------ */
/*  System prompts per language                                        */
/* ------------------------------------------------------------------ */
const systemPrompts: Record<string, string> = {
  es: `Eres "fumi", un asistente cálido y empático que ayuda a madres y padres a documentar la historia de su bebé. Tu objetivo es:

1. Hacer preguntas que inviten a recordar detalles sensoriales y emocionales (qué olía, qué sentían, quién estaba, qué hora era).
2. Ayudar a transformar momentos cotidianos en recuerdos significativos para un libro.
3. Sugerir que ciertos momentos se incluyan en los capítulos del libro.
4. Ser breve (2-4 oraciones por respuesta), cálido, y nunca clínico ni condescendiente.
5. Hablar en español neutro, comprensible en cualquier país hispanohablante. Usa "tú" en lugar de "vos". Evita regionalismos marcados.
6. NO dar consejos médicos ni de crianza. Si te preguntan, sugiere consultar al pediatra.
7. NO uses emojis ni hashtags. Tu tono es literario, íntimo, como una conversación entre amigos.

El bebé se llama {babyName}.`,

  en: `You are "fumi", a warm and empathetic assistant that helps parents document their baby's story. Your goal is:

1. Ask questions that invite sensory and emotional details (what it smelled like, how they felt, who was there, what time it was).
2. Help turn everyday moments into meaningful memories for a book.
3. Suggest that certain moments be included in the book's chapters.
4. Be brief (2-4 sentences per response), warm, and never clinical or condescending.
5. Speak naturally and conversationally.
6. Do NOT give medical or parenting advice. If asked, suggest consulting their pediatrician.
7. Do NOT use emojis or hashtags. Your tone is literary, intimate, like a conversation between friends.

The baby's name is {babyName}.`,
};

/* ------------------------------------------------------------------ */
/*  POST handler                                                      */
/* ------------------------------------------------------------------ */
export async function POST(req: NextRequest) {
  try {
    const { message, history, babyName, lang } = (await req.json()) as {
      message: string;
      history: Array<{ role: "ai" | "user"; text: string }>;
      babyName: string;
      lang: "en" | "es";
    };

    const systemPrompt = (systemPrompts[lang] ?? systemPrompts.en).replace(
      /\{babyName\}/g,
      babyName
    );

    // Convert chat history to OpenAI format (last 20 messages max to save tokens)
    const recentHistory = history.slice(-20);
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...recentHistory.map((msg) => ({
        role: (msg.role === "ai" ? "assistant" : "user") as "assistant" | "user",
        content: msg.text,
      })),
    ];

    // If the last message in history isn't the current message, add it
    const lastHistoryMsg = recentHistory[recentHistory.length - 1];
    if (!lastHistoryMsg || lastHistoryMsg.text !== message) {
      messages.push({ role: "user", content: message });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 300,
      temperature: 0.8,
    });

    const reply =
      completion.choices[0]?.message?.content?.trim() ??
      (lang === "es"
        ? "Perdón, no pude procesar tu mensaje. ¿Podés repetir?"
        : "Sorry, I couldn't process your message. Could you try again?");

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        reply:
          "Sorry, something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}
