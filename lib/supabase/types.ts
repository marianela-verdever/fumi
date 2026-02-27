import type { Baby, Entry, Chapter, OwnTextBlock, Voice, ChapterStatus, EntryType, Tag } from "@/lib/types";

// ─── DB Row shapes (snake_case, mirrors Supabase schema) ───────────────────

export interface BabyRow {
  id: string;
  name: string;
  birth_date: string;
  created_at: string;
}

export interface EntryRow {
  id: string;
  baby_id: string;
  date: string;
  type: string;
  content: string;
  media_urls: string[];
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ChapterRow {
  id: string;
  baby_id: string;
  month: number;
  period: string | null;
  status: string;
  voice: string;
  generated_content: string;
  own_text_blocks: OwnTextBlock[];
  entry_ids: string[];
  created_at: string;
  updated_at: string;
}

// ─── Mappers: DB row → app type ────────────────────────────────────────────

export function rowToBaby(row: BabyRow): Baby {
  return {
    id: row.id,
    name: row.name,
    birthDate: row.birth_date,
    createdAt: row.created_at,
  };
}

export function rowToEntry(row: EntryRow): Entry {
  return {
    id: row.id,
    babyId: row.baby_id,
    date: row.date,
    type: row.type as EntryType,
    content: row.content,
    mediaUrls: row.media_urls,
    tags: row.tags as Tag[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function rowToChapter(row: ChapterRow): Chapter {
  return {
    id: row.id,
    babyId: row.baby_id,
    month: row.month,
    period: row.period ?? "",
    status: row.status as ChapterStatus,
    voice: row.voice as Voice,
    generatedContent: row.generated_content,
    ownTextBlocks: row.own_text_blocks ?? [],
    entryIds: row.entry_ids,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
