"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase/client";
import { rowToBaby } from "@/lib/supabase/types";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    // Not authenticated → login
    if (!user) {
      router.replace("/login");
      return;
    }

    // Authenticated → check for baby
    const baby = localStorage.getItem("fumi_baby");
    if (baby) {
      router.replace("/timeline");
      return;
    }

    // No cached baby → try fetching from Supabase
    supabase
      .from("babies")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) {
          localStorage.setItem("fumi_baby", JSON.stringify(rowToBaby(data)));
          router.replace("/timeline");
        } else {
          router.replace("/onboarding");
        }
      });
  }, [user, loading, router]);

  return (
    <div className="w-full max-w-[390px] min-h-dvh mx-auto bg-fumi-bg flex items-center justify-center">
      <span className="font-[family-name:var(--font-playfair)] text-[28px] text-fumi-accent font-medium italic">
        fumi.
      </span>
    </div>
  );
}
