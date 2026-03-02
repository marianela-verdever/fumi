"use client";

import { useState } from "react";
import { useLang } from "@/lib/lang-context";
import type { Lang } from "@/lib/i18n";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const { lang, setLang, t } = useLang();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");

    const redirectTo = `${window.location.origin}/auth/callback`;

    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    });

    if (authError) {
      setError(
        lang === "en"
          ? "Something went wrong. Try again."
          : "Algo salió mal. Intentá de nuevo."
      );
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  return (
    <div className="w-full max-w-[390px] min-h-dvh mx-auto bg-fumi-bg flex flex-col justify-center px-8">
      {/* Language toggle */}
      <div className="absolute top-6 right-6 flex gap-1.5">
        {(["en", "es"] as Lang[]).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`px-3 py-1 rounded-[20px] font-[family-name:var(--font-dm-sans)] text-[11px] uppercase tracking-[0.08em] cursor-pointer transition-all ${
              lang === l
                ? "bg-fumi-accent text-white border-none"
                : "bg-transparent border border-fumi-border text-fumi-text-muted"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="mb-12">
        <span className="font-[family-name:var(--font-playfair)] text-[32px] text-fumi-accent font-medium italic">
          fumi.
        </span>
        <p className="font-[family-name:var(--font-dm-sans)] text-[15px] text-fumi-text-secondary mt-3 leading-relaxed">
          {t.login.subtitle}
        </p>
      </div>

      {!sent ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="font-[family-name:var(--font-dm-sans)] text-[11px] uppercase tracking-[0.1em] text-fumi-text-muted block mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.login.emailPlaceholder}
              required
              className="w-full bg-white border border-fumi-border rounded-[14px] px-4 py-3.5 font-[family-name:var(--font-dm-sans)] text-[15px] text-fumi-text outline-none focus:border-fumi-accent transition-colors"
            />
          </div>

          {error && (
            <p className="font-[family-name:var(--font-dm-sans)] text-[13px] text-red-400 text-center -mt-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!email.trim() || loading}
            className="w-full bg-fumi-accent text-white border-none rounded-[12px] py-4 font-[family-name:var(--font-dm-sans)] text-[15px] font-medium cursor-pointer mt-2 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {loading ? "..." : t.login.sendLink}
          </button>
        </form>
      ) : (
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="text-[40px]">✉️</span>
          <h2 className="font-[family-name:var(--font-playfair)] text-[22px] text-fumi-text font-medium m-0">
            {t.login.linkSent}
          </h2>
          <p className="font-[family-name:var(--font-dm-sans)] text-[14px] text-fumi-text-secondary leading-relaxed m-0">
            {t.login.linkSentSubtitle}
          </p>
          <button
            onClick={() => { setSent(false); setEmail(""); }}
            className="mt-4 font-[family-name:var(--font-dm-sans)] text-[13px] text-fumi-accent bg-transparent border-none cursor-pointer underline"
          >
            {lang === "en" ? "Use a different email" : "Usar otro email"}
          </button>
        </div>
      )}
    </div>
  );
}
