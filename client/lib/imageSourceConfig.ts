/**
 * Configuration for image source (Supabase Storage or Google Drive)
 * Can be toggled in settings or environment variables
 */

export type ImageSource = 'supabase' | 'googledrive';

const STORAGE_KEY = 'image_source_preference';

/**
 * Get the current image source preference
 * Defaults to Supabase if not configured
 */
export function getImageSource(): ImageSource {
  const preference = localStorage.getItem(STORAGE_KEY) as ImageSource | null;
  
  if (preference === 'googledrive' || preference === 'supabase') {
    return preference;
  }

  // Default to supabase if not set
  return 'supabase';
}

/**
 * Set the image source preference
 */
export function setImageSource(source: ImageSource): void {
  localStorage.setItem(STORAGE_KEY, source);
  console.log(`[imageSourceConfig] Image source changed to: ${source}`);
}

/**
 * Check if Google Drive integration is available
 */
export function isGoogleDriveAvailable(): boolean {
  const apiKey = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY;
  const folderId = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID;
  return !!(apiKey && folderId);
}

/**
 * Check if Supabase Storage is available
 */
export function isSupabaseAvailable(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  return !!(url && key);
}
