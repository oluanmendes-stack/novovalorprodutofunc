/**
 * Configuration for catalog source (Supabase Storage or Google Drive)
 * Can be toggled in settings
 */

export type CatalogSource = 'supabase' | 'googledrive';

const STORAGE_KEY = 'catalog_source_preference';

/**
 * Get the current catalog source preference
 * Defaults to Supabase if not configured
 */
export function getCatalogSource(): CatalogSource {
  const preference = localStorage.getItem(STORAGE_KEY) as CatalogSource | null;
  
  if (preference === 'googledrive' || preference === 'supabase') {
    return preference;
  }

  // Default to supabase if not set
  return 'supabase';
}

/**
 * Set the catalog source preference
 */
export function setCatalogSource(source: CatalogSource): void {
  localStorage.setItem(STORAGE_KEY, source);
  console.log(`[catalogSourceConfig] Catalog source changed to: ${source}`);
}

/**
 * Check if Google Drive integration is available for catalogs
 */
export function isGoogleDriveAvailableForCatalogs(): boolean {
  const apiKey = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY;
  return !!apiKey;
}

/**
 * Check if Supabase Storage is available for catalogs
 */
export function isSupabaseAvailableForCatalogs(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  return !!(url && key);
}
