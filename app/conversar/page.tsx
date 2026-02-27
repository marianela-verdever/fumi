"use client";

import { useState, useRef, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import Header from "@/components/layout/Header";
import type { ChatMessage } from "@/lib/types";
import { useLang } from "@/lib/lang-context";

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[82%] px-4 py-3 ${
          isUser
            ? "bg-fumi-accent text-white rounded-[16px_16px_4px_16px]"
            : "bg-fumi-ai-bg text-fumi-text rounded-[16px_16px_16px_4px]"
        }`}
      >
        {!isUser && (
          <span className="block text-[10px] tracking-[0.08em] uppercase text-fumi-text-muted mb-1.5 font-[family-name:var(--font-dm-sans)]">
            ✦ fumi
          </span>
        )}
        <p className="font-[family-name:var(--font-dm-sans)] text-[14px] m-0 leading-[1.55]">
          {message.text}
        </p>
      </div>
    </div>
  );
}

export default function ConversarPage() {
  const { t, lang } = useLang();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [babyName, setBabyName] = useState("Baby");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load baby name + set initial greeting
  useEffect(() => {
    const stored = localStorage.getItem("fumi_baby");
    let name = "Baby";
    if (stored) {
      const baby = JSON.parse(stored);
      name = baby.name;
      setBabyName(name);
    }
    // Initial AI greeting
    const greeting: ChatMessage = {
      role: "ai",
      text:
        lang === "es"
          ? `¡Hola! Soy tu asistente de fumi. Contame sobre ${name} — ¿qué momento querés recordar hoy?`
          : `Hi! I'm your fumi assistant. Tell me about ${name} — what moment do you want to remember today?`,
    };
    setMessages([greeting]);
  }, [lang]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: ChatMessage = { role: "user", text: input.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.text,
          history: updatedMessages,
          babyName,
          lang,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "ai", text: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text:
            lang === "es"
              ? "Perdón, algo salió mal. ¿Podés repetir?"
              : "Sorry, something went wrong. Could you try again?",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100dvh-80px)]">
        <Header title={t.chat.title} subtitle={t.chat.subtitle} />

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-grow px-6 pt-4 overflow-y-auto flex flex-col gap-4"
        >
          {messages.map((msg, i) => (
            <ChatBubble key={i} message={msg} />
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-fumi-ai-bg rounded-[16px_16px_16px_4px] px-4 py-3">
                <span className="block text-[10px] tracking-[0.08em] uppercase text-fumi-text-muted mb-1.5 font-[family-name:var(--font-dm-sans)]">
                  ✦ fumi
                </span>
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-fumi-accent"
                      style={{ animation: `fade-dots 1s ${i * 0.2}s infinite` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="px-6 py-3 border-t border-fumi-border flex gap-2.5 items-center bg-white">
          <div className="flex-grow bg-fumi-bg-warm rounded-[24px] px-[18px] py-2.5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.chat.inputPlaceholder}
              className="border-none outline-none bg-transparent font-[family-name:var(--font-dm-sans)] text-[14px] text-fumi-text w-full"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="w-10 h-10 rounded-full bg-fumi-accent border-none text-white text-[16px] cursor-pointer flex items-center justify-center shrink-0 disabled:opacity-40 transition-opacity"
          >
            ↑
          </button>
        </div>
      </div>
    </AppShell>
  );
}
