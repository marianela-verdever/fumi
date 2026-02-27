export type EntryType = 'text' | 'photo' | 'audio' | 'mixed';
export type ChapterStatus = 'collecting' | 'draft' | 'approved';
export type Voice = 'yo' | 'nosotros' | 'baby';
export type BookFormat = 'narrative' | 'comic';
export type Tag = 'primera vez' | 'milestone' | 'gracioso' | 'familia' | 'salud';

export interface Baby {
  id: string;
  name: string;
  birthDate: string; // ISO date string
  createdAt: string;
}

export interface Entry {
  id: string;
  babyId: string;
  date: string; // ISO date string
  type: EntryType;
  content: string;
  mediaUrls: string[];
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
}

export interface OwnTextBlock {
  id: string;
  content: string;
  position: number; // order relative to generated content
}

export interface Chapter {
  id: string;
  babyId: string;
  month: number;
  period: string;
  status: ChapterStatus;
  voice: Voice;
  generatedContent: string;
  ownTextBlocks: OwnTextBlock[];
  entryIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Book {
  id: string;
  babyId: string;
  format: BookFormat;
  voice: Voice;
  chapterIds: string[];
  exportedAt: string | null;
}

export interface ChatMessage {
  role: 'ai' | 'user';
  text: string;
}
