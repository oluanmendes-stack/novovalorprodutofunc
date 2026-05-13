/**
 * Utility for managing Supabase Storage URLs
 * Provides consistent URL generation for catalogs, descriptors, and images
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/**
 * Generate a public URL for a file in Supabase Storage
 */
function getStorageUrl(bucket: string, filePath: string): string {
  if (!SUPABASE_URL) return "";

  // Ensure file path is properly encoded
  const encodedPath = filePath
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${encodedPath}`;
}

/**
 * Get URL for a catalog file
 * @param catalogCode - Product code (e.g., "ODM-DE0062B") or filename ("ODM-DE0062B.docx")
 * @returns Full URL to the catalog file
 */
export function getCatalogStorageUrl(catalogCode: string): string {
  // Avoid double extensions like .doc.doc
  const filename = catalogCode.includes('.') ? catalogCode : `${catalogCode}.doc`;

  // Bucket named "catalogo" (correct name)
  return getStorageUrl("catalogo", filename);
}

/**
 * Get URL for a descriptor file
 * @param descriptorCode - Product code (e.g., "A04")
 * @returns Full URL to the descriptor file
 */
export function getDescriptorStorageUrl(descriptorCode: string): string {
  return getStorageUrl("descritivos", `${descriptorCode}.txt`);
}

/**
 * Get URL for an image file
 * @param imagePath - Relative path to image (e.g., "MED-LINKET/A - FOTOS.../S0026OX-S.JPG")
 * @returns Full URL to the image
 */
export function getImageStorageUrl(imagePath: string): string {
  return getStorageUrl("imagens", imagePath);
}

/**
 * Check if we should use Supabase Storage
 */
export function shouldUseSupabaseStorage(): boolean {
  // If we have Supabase configured, always use it
  if (import.meta.env.VITE_SUPABASE_URL) {
    return true;
  }

  // In production, always use Supabase Storage
  if (import.meta.env.PROD) {
    return true;
  }

  // Fallback
  return import.meta.env.VITE_USE_STORAGE_DEV === "true";
}

/**
 * Get the base Supabase URL
 */
export function getSupabaseStorageBaseUrl(): string {
  return SUPABASE_URL ? `${SUPABASE_URL}/storage/v1/object/public` : "";
}
