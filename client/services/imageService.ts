import { shouldUseSupabaseStorage, getImageStorageUrl } from "@/lib/supabase-storage";
import { supabase } from "@/lib/supabase";
import { findGoogleDriveImages, clearGoogleDriveImageCache } from "./googleDriveImageService";
import { getImageSource, isGoogleDriveAvailable } from "@/lib/imageSourceConfig";

/**
 * Service to find product images from multiple sources
 * - Primary: Google Drive (if configured)
 * - Fallback: Supabase Storage (organized by brand folders in the 'imagens' bucket)
 *
 * In production: Uses Supabase Storage or Google Drive
 * In development: Uses local API endpoint or Google Drive
 */

export interface ProductImage {
  path: string;
  filename: string;
}

// Cache for checked image paths to avoid repeated failed requests
const imageCache = new Map<string, string[]>();

/**
 * Função desativada - usando apenas Google Drive
 */
export async function preCacheFolderStructure(): Promise<void> {
  console.log("[imageService] Supabase Storage desativado");
}


/**
 * Find images for a product code - Google Drive only
 */
export async function findProductImages(code: string): Promise<string[]> {
  const cacheKey = `googledrive::${code}`;

  if (!isGoogleDriveAvailable()) {
    console.warn(`[findProductImages] Google Drive não configurado`);
    return [];
  }

  console.log(`[findProductImages] Buscando no Google Drive: ${code}`);
  const googleDriveImages = await findGoogleDriveImages(code);
  imageCache.set(cacheKey, googleDriveImages);
  return googleDriveImages;
}



/**
 * Normalize image paths from Supabase records or web URLs
 * Handles both direct web paths and legacy database paths
 * Returns the path unchanged if it's already a full URL
 */
function normalizeImagePath(imagePath: string): string {
  if (!imagePath) return imagePath;

  // If already a full URL (http/https or Google Drive), return as-is
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  // If path already starts with /, it's a web path and is ready to use
  if (imagePath.startsWith("/")) {
    return imagePath;
  }

  // Otherwise, prepend /catalogo/imagens/ for database paths
  if (!imagePath.startsWith("catalogo")) {
    return `/catalogo/imagens/${imagePath}`;
  }

  return `/${imagePath}`;
}

/**
 * Get the image URL for display
 * Normalizes paths and returns the correct reference to static files or Supabase Storage
 */
export function getImageUrl(imagePath: string): string {
  return normalizeImagePath(imagePath);
}

/**
 * Try to find images with multiple attempts
 * Useful for different image naming conventions
 */
export async function findImagesFlexible(code: string): Promise<string[]> {
  // If the code contains a slash, try to find images for any of the parts
  if (code.includes('/')) {
    const parts = code.split('/').map(p => p.trim()).filter(p => p.length > 0);
    const allImages = new Set<string>();

    for (const part of parts) {
      // Recursively find images for each part
      const partImages = await findImagesFlexible(part);
      partImages.forEach(img => allImages.add(img));
    }

    // If we found any images for the parts, return them
    if (allImages.size > 0) {
      return Array.from(allImages);
    }
  }

  // First try exact match
  let images = await findProductImages(code);

  // If no images found, try some variations
  if (images.length === 0) {
    // Try with lowercase
    images = await findProductImages(code.toLowerCase());
  }

  if (images.length === 0) {
    // Try with uppercase
    images = await findProductImages(code.toUpperCase());
  }

  // If still no images, try removing special characters
  if (images.length === 0) {
    const cleanCode = code.replace(/[^a-zA-Z0-9]/g, '');
    if (cleanCode !== code) {
      images = await findProductImages(cleanCode);
    }
  }

  return images;
}

/**
 * Clear all image caches (both Supabase and Google Drive)
 */
export function clearAllImageCaches(): void {
  imageCache.clear();
  clearGoogleDriveImageCache();
  console.log('[imageService] All image caches cleared');
}

/**
 * Export image source configuration for UI usage
 */
export { getImageSource, setImageSource, isGoogleDriveAvailable, isSupabaseAvailable } from '@/lib/imageSourceConfig';
