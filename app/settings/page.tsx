"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import Header from "@/components/layout/Header";
import { useLang } from "@/lib/lang-context";
import { useAuth } from "@/lib/auth-context";
import type { Lang } from "@/lib/i18n";
import type { Baby } from "@/lib/types";
import { supabase } from "@/lib/supabase/client";
import { getTodayISO } from "@/lib/utils";

export default function SettingsPage() {
  const router = useRouter();
  const { t, lang, setLang } = useLang();
  const { user, signOut } = useAuth();

  const [baby, setBaby] = useState<Baby | null>(null);
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [selectedLang, setSelectedLang] = useState<Lang>(lang);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("fumi_baby");
    if (stored) {
      const b: Baby = JSON.parse(stored);
      setBaby(b);
      setName(b.name);
      setBirthDate(b.birthDate);
    }
  }, []);

  const handleSave = async () => {
    if (!baby || !name.trim() || !birthDate) return;
    setSaving(true);
    setSaved(false);

    const { error } = await supabase
      .from("babies")
      .update({ name: name.trim(), birth_date: birthDate })
      .eq("id", baby.id);

    if (!error) {
      // Update localStorage
      const updated = { ...baby, name: name.trim(), birthDate };
      localStorage.setItem("fumi_baby", JSON.stringify(updated));
      setBaby(updated);

      // Apply language change
      if (selectedLang !== lang) {
        setLang(selectedLang);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }

    setSaving(false);
  };

  const handleLogout = async () => {
    await signOut();
    router.replace("/login");
  };

  const hasChanges =
    baby && (name.trim() !== baby.name || birthDate !== baby.birthDate || selectedLang !== lang);

  return (
    <AppShell>
      <Header title={t.settings.title} />

      <div className="px-6 pt-4 flex flex-col gap-5">
        {/* Baby name */}
        <div>
          <label className="font-[family-name:var(--font-dm-sans)] text-[11px] uppercase tracking-[0.1em] text-fumi-text-muted block mb-2">
            {t.settings.babyNameLabel}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white border border-fumi-border rounded-[14px] px-4 py-3.5 font-[family-name:var(--font-playfair)] text-[18px] text-fumi-text outline-none focus:border-fumi-accent transition-colors"
          />
        </div>

        {/* Birth date */}
        <div>
          <label className="font-[family-name:var(--font-dm-sans)] text-[11px] uppercase tracking-[0.1em] text-fumi-text-muted block mb-2">
            {t.settings.birthDateLabel}
          </label>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            max={getTodayISO()}
            className="w-full bg-white border border-fumi-border rounded-[14px] px-4 py-3.5 font-[family-name:var(--font-dm-sans)] text-[15px] text-fumi-text outline-none focus:border-fumi-accent transition-colors"
          />
        </div>

        {/* Language */}
        <div>
          <label className="font-[family-name:var(--font-dm-sans)] text-[11px] uppercase tracking-[0.1em] text-fumi-text-muted block mb-2">
            {t.settings.languageLabel}
          </label>
          <div className="flex gap-2">
            {(["en", "es"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setSelectedLang(l)}
                className={`flex-1 py-3 rounded-[12px] font-[family-name:var(--font-dm-sans)] text-[14px] cursor-pointer transition-all ${
                  selectedLang === l
                    ? "bg-fumi-accent text-white border-none"
                    : "bg-white border border-fumi-border text-fumi-text-secondary"
                }`}
              >
                {l === "en" ? "English" : "Español"}
              </button>
            ))}
          </div>
        </div>

        {/* Email (read-only) */}
        {user?.email && (
          <div>
            <label className="font-[family-name:var(--font-dm-sans)] text-[11px] uppercase tracking-[0.1em] text-fumi-text-muted block mb-2">
              Email
            </label>
            <p className="font-[family-name:var(--font-dm-sans)] text-[14px] text-fumi-text-secondary m-0 px-1">
              {user.email}
            </p>
          </div>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="w-full bg-fumi-accent text-white border-none rounded-[12px] py-4 font-[family-name:var(--font-dm-sans)] text-[15px] font-medium cursor-pointer mt-1 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          {saved
            ? t.settings.saved
            : saving
              ? "..."
              : t.settings.saveButton}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full bg-transparent text-red-400 border border-red-200 rounded-[12px] py-3 font-[family-name:var(--font-dm-sans)] text-[13px] cursor-pointer transition-colors hover:bg-red-50"
        >
          {t.settings.logoutButton}
        </button>
      </div>
    </AppShell>
  );
}
