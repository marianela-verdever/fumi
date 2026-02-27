"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const baby = localStorage.getItem("fumi_baby");
    if (baby) {
      router.replace("/timeline");
    } else {
      router.replace("/onboarding");
    }
  }, [router]);

  return (
    <div className="w-full max-w-[390px] min-h-dvh mx-auto bg-fumi-bg flex items-center justify-center">
      <span className="font-[family-name:var(--font-playfair)] text-[28px] text-fumi-accent font-medium italic">
        fumi.
      </span>
    </div>
  );
}
