"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // The Supabase browser client auto-detects ?code= in the URL
    // and exchanges it for a session (PKCE flow, verifier in cookies).
    // We listen for the auth state change to know when it's done.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        router.replace("/");
      }
    });

    // Fallback: if the auto-detection doesn't fire within 5s,
    // try manual exchange or redirect to login
    const timeout = setTimeout(() => {
      router.replace("/login");
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <div className="w-full max-w-[390px] min-h-dvh mx-auto bg-fumi-bg flex items-center justify-center">
      <span className="font-[family-name:var(--font-playfair)] text-[28px] text-fumi-accent font-medium italic animate-pulse">
        fumi.
      </span>
    </div>
  );
}
