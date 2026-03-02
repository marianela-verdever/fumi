"use client";

import { useRouter } from "next/navigation";
import NavBar from "./NavBar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <div className="w-full max-w-[390px] h-dvh mx-auto bg-fumi-bg relative flex flex-col">
      {/* Top bar */}
      <div className="flex justify-between items-center px-6 pt-3 pb-1 safe-area-top shrink-0">
        <div className="w-8" />
        <span className="font-[family-name:var(--font-playfair)] text-[15px] text-fumi-accent font-medium italic">
          fumi.
        </span>
        <button
          onClick={() => router.push("/settings")}
          className="w-8 h-8 flex flex-col items-center justify-center gap-[3.5px] bg-transparent border-none cursor-pointer"
          aria-label="Settings"
        >
          <span className="block w-[14px] h-[1.5px] bg-fumi-text-muted rounded-full" />
          <span className="block w-[14px] h-[1.5px] bg-fumi-text-muted rounded-full" />
          <span className="block w-[14px] h-[1.5px] bg-fumi-text-muted rounded-full" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-32">
        {children}
      </div>

      <NavBar />
    </div>
  );
}
