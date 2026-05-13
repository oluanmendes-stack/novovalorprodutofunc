import { shouldUseSupabaseStorage, getDescriptorStorageUrl } from "@/lib/supabase-storage";

/**
 * Service to load product descriptors and ANVISA registration from static files
 * In production: Uses Supabase Storage
 * In development: Uses local static files
 */

export interface DescriptorData {
  descriptor: string;
  registration?: string;
}

/**
 * Load product descriptor from static file or Supabase Storage
 * Looks for files at /catalogo/descritivos/{code}.txt (dev)
 * Or uses Supabase Storage URL (production)
 */
export async function getDescriptor(code: string): Promise<DescriptorData | null> {
  try {
    // Normalize the code path - replace spaces with underscores and encode
    const normalizedCode = code.trim().replace(/\s+/g, '_');

    // Determine which URL to use
    let filePath: string;

    if (shouldUseSupabaseStorage()) {
      filePath = getDescriptorStorageUrl(normalizedCode);
    } else {
      filePath = `/catalogo/descritivos/${encodeURIComponent(normalizedCode)}.txt`;
    }

    const response = await fetch(filePath);

    if (!response.ok) {
      console.warn(`Descriptor file not found: ${filePath}`);
      return null;
    }

    const descriptor = await response.text();
    const registration = parseAnvisaFromDescriptor(descriptor);

    return {
      descriptor,
      registration,
    };
  } catch (error) {
    console.error(`Error loading descriptor for ${code}:`, error);
    return null;
  }
}

/**
 * Extract ANVISA registration number from descriptor text
 * Looks for pattern like "Registro: 80415610039"
 */
export function parseAnvisaFromDescriptor(descriptorText: string): string | undefined {
  const anvisaMatch = descriptorText.match(/Registro:\s*(\d+)/i);
  return anvisaMatch ? anvisaMatch[1] : undefined;
}

/**
 * Utility function to normalize product codes for file paths
 * Some files have spaces/special characters in names
 */
export function normalizeCodeForFilePath(code: string): string {
  return code.trim().replace(/\s+/g, '_');
}
