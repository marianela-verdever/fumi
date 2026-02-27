"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/lib/lang-context";

export default function NavBar() {
  const pathname = usePathname();
  const { t } = useLang();

  const items = [
    { id: "timeline", href: "/timeline", label: t.nav.timeline, icon: "◯" },
    { id: "agregar", href: "/agregar", label: t.nav.add, icon: "+" },
    { id: "conversar", href: "/conversar", label: t.nav.chat, icon: "◬" },
    { id: "capitulos", href: "/capitulos", label: t.nav.chapters, icon: "▭" },
    { id: "libro", href: "/libro", label: t.nav.book, icon: "◻" },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] flex justify-around items-center pt-2.5 pb-5 safe-area-bottom bg-white border-t border-fumi-border z-50">
      {items.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const isAdd = item.id === "agregar";

        return (
          <Link
            key={item.id}
            href={item.href}
            className="flex flex-col items-center gap-[3px] px-3 py-1 no-underline"
          >
            <span
              className={`flex items-center justify-center leading-none ${
                isAdd
                  ? "text-[22px] font-light w-[34px] h-[34px] rounded-full bg-fumi-accent text-white"
                  : `text-[18px] ${isActive ? "text-fumi-accent" : "text-fumi-text-muted"}`
              }`}
            >
              {item.icon}
            </span>
            <span
              className={`font-[family-name:var(--font-dm-sans)] text-[10px] tracking-[0.03em] ${
                isActive ? "text-fumi-accent" : "text-fumi-text-muted"
              }`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
