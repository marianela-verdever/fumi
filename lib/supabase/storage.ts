import { supabase } from "./client";

const BUCKET = "entry-media";
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

/**
 * Upload a single image file to Supabase Storage and return its public URL.
 */
export async function uploadEntryMedia(
  file: File,
  babyId: string
): Promise<string> {
  // Validate type
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}`);
  }

  // Validate size
  if (file.size > MAX_SIZE) {
    throw new Error("File exceeds 10 MB limit");
  }

  // Unique path: babyId/timestamp_filename
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${babyId}/${Date.now()}_${safeName}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return publicUrl;
}
