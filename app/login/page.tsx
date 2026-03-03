"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/lang-context";
import type { Lang } from "@/lib/i18n";
import { supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const { lang, setLang, t } = useLang();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = (seconds: number) => {
    setCooldown(seconds);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) {
          clearInterval(cooldownRef.current!);
          cooldownRef.current = null;
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  // Basic email format validation
  const isValidEmail = (value: string): boolean => {
    const trimmed = value.trim();
    // Must have exactly one @, a domain with a dot, and reasonable lengths
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return re.test(trimmed) && trimmed.length >= 6;
  };

  const handleSendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.trim() || cooldown > 0) return;

    // Validate email format before calling Supabase
    if (!isValidEmail(email)) {
      setError(t.login.invalidEmail);
      return;
    }

    setLoading(true);
    setError("");

    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      // No emailRedirectTo → Supabase sends a 6-digit code, not a magic link
    });

    if (authError) {
      if (authError.status === 429) {
        setError(t.login.rateLimited);
        startCooldown(60);
      } else {
        setError(
          lang === "en"
            ? "Something went wrong. Try again."
            : "Algo salió mal. Intentá de nuevo."
        );
      }
      setLoading(false);
      return;
    }

    setStep("code");
    setCode("");
    setLoading(false);
  };

  const handleVerifyCode = async (codeValue = code) => {
    if (codeValue.length < 8 || loading) return;
    setLoading(true);
    setError("");

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: codeValue.trim(),
      type: "email",
    });

    if (verifyError) {
      setError(t.login.wrongCode);
      setLoading(false);
      return;
    }

    router.push("/");
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
          {step === "email" ? t.login.subtitle : t.login.enterCode}
        </p>
      </div>

      {step === "email" ? (
        <form onSubmit={handleSendCode} className="flex flex-col gap-5">
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
            disabled={!email.trim() || loading || cooldown > 0}
            className="w-full bg-fumi-accent text-white border-none rounded-[12px] py-4 font-[family-name:var(--font-dm-sans)] text-[15px] font-medium cursor-pointer mt-2 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {loading
              ? "..."
              : cooldown > 0
              ? `${t.login.sendLink} (${cooldown}s)`
              : t.login.sendLink}
          </button>
        </form>
      ) : (
        <div className="flex flex-col gap-5">
          <div>
            <p className="font-[family-name:var(--font-dm-sans)] text-[13px] text-fumi-text-secondary mb-1">
              {t.login.enterCodeSubtitle}{" "}
              <span className="text-fumi-text font-medium">{email}</span>
            </p>
            <p className="font-[family-name:var(--font-dm-sans)] text-[12px] text-fumi-text-muted mb-4">
              {t.login.checkSpam}
            </p>
            <label className="font-[family-name:var(--font-dm-sans)] text-[11px] uppercase tracking-[0.1em] text-fumi-text-muted block mb-2">
              {t.login.enterCode}
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={8}
              value={code}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 8);
                setCode(val);
                if (val.length === 8) handleVerifyCode(val);
              }}
              placeholder={t.login.codePlaceholder}
              autoFocus
              className="w-full bg-white border border-fumi-border rounded-[14px] px-4 py-3.5 font-[family-name:var(--font-dm-sans)] text-[22px] text-fumi-text outline-none focus:border-fumi-accent transition-colors tracking-[0.3em] text-center"
            />
          </div>

          {error && (
            <p className="font-[family-name:var(--font-dm-sans)] text-[13px] text-red-400 text-center -mt-2">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={() => handleVerifyCode()}
            disabled={code.length < 8 || loading}
            className="w-full bg-fumi-accent text-white border-none rounded-[12px] py-4 font-[family-name:var(--font-dm-sans)] text-[15px] font-medium cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {loading ? "..." : t.login.verifyCode}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep("email");
              setCode("");
              setError("");
            }}
            className="font-[family-name:var(--font-dm-sans)] text-[13px] text-fumi-accent bg-transparent border-none cursor-pointer text-center"
          >
            {t.login.resendCode}
          </button>
        </div>
      )}
    </div>
  );
}
