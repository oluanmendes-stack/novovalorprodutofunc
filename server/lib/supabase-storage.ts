/**
 * Server-side utility for Supabase Storage URLs
 * Mirrors the client-side implementation in client/lib/supabase-storage.ts
 */


/**
 * Check if we should use Supabase Storage
 * In production (NODE_ENV=production), always use Supabase Storage
 */
export function shouldUseSupabaseStorage(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Generate a public URL for a file in Supabase Storage
 */
export function getStorageUrl(bucket: string, filePath: string): string {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;

  if (!supabaseUrl) {
    console.warn("[supabase-storage] SUPABASE_URL not set");
    return "";
  }

  // Ensure file path is properly encoded
  const encodedPath = filePath
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${encodedPath}`;
}

/**
 * Get URL for a catalog file
 */
export function getCatalogStorageUrl(fileName: string): string {
  // Avoid double extensions like .doc.doc
  const filename = fileName.includes('.') ? fileName : `${fileName}.doc`;

  // Bucket named "catalogo" (correct name)
  return getStorageUrl("catalogo", filename);
}

/**
 * Get URL for a descriptor file
 */
export function getDescriptorStorageUrl(fileName: string): string {
  // Ensure file has .txt extension
  const filename = fileName.endsWith(".txt") ? fileName : `${fileName}.txt`;
  return getStorageUrl("descritivos", filename);
}

/**
 * Get URL for an image file
 */
export function getImageStorageUrl(filePath: string): string {
  return getStorageUrl("imagens", filePath);
}

/**
 * Get the base Supabase Storage URL
 */
export function getSupabaseStorageBaseUrl(): string {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  return supabaseUrl ? `${supabaseUrl}/storage/v1/object/public` : "";
}
