"use client";

import NavBar from "./NavBar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-[390px] h-dvh mx-auto bg-fumi-bg relative flex flex-col">
      {/* Status bar */}
      <div className="flex justify-between items-center px-6 pt-3 safe-area-top shrink-0">
        <span className="font-[family-name:var(--font-dm-sans)] text-[11px] font-semibold text-fumi-text">
          9:41
        </span>
        <span className="font-[family-name:var(--font-playfair)] text-[15px] text-fumi-accent font-medium italic">
          fumi.
        </span>
        <span className="font-[family-name:var(--font-dm-sans)] text-[11px] text-fumi-text">
          ●●●●
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-32">
        {children}
      </div>

      <NavBar />
    </div>
  );
}
