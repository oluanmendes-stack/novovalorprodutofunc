import { useState, useCallback } from "react";
import { findGoogleDriveImages } from "@/services/googleDriveImageService";
import { toast } from "sonner";

interface GoogleDriveImagesCache {
  [code: string]: string[];
}

export function useCompatibilityGoogleDrive() {
  const [googleDriveImages, setGoogleDriveImages] = useState<GoogleDriveImagesCache>({});
  const [loadingCodes, setLoadingCodes] = useState<Set<string>>(new Set());

  /**
   * Fetch Google Drive images for a specific accessory code
   */
  const fetchGoogleDriveImages = useCallback(async (code: string): Promise<string[]> => {
    if (!code || code.trim() === "") {
      return [];
    }

    // Return cached result if available
    if (googleDriveImages[code]) {
      return googleDriveImages[code];
    }

    // Avoid multiple simultaneous requests for the same code
    if (loadingCodes.has(code)) {
      return [];
    }

    try {
      setLoadingCodes((prev) => new Set([...prev, code]));
      console.log(`[useCompatibilityGoogleDrive] Fetching images for: ${code}`);

      const images = await findGoogleDriveImages(code);

      setGoogleDriveImages((prev) => ({
        ...prev,
        [code]: images,
      }));

      console.log(`[useCompatibilityGoogleDrive] Found ${images.length} images for ${code}`);
      return images;
    } catch (error) {
      console.error(`[useCompatibilityGoogleDrive] Error fetching images for ${code}:`, error);
      return [];
    } finally {
      setLoadingCodes((prev) => {
        const newSet = new Set(prev);
        newSet.delete(code);
        return newSet;
      });
    }
  }, [googleDriveImages, loadingCodes]);

  /**
   * Refresh Google Drive images for a specific code (bypass cache)
   */
  const refreshGoogleDriveImages = useCallback(async (code: string): Promise<string[]> => {
    if (!code || code.trim() === "") {
      toast.error("Código do acessório é necessário");
      return [];
    }

    try {
      setLoadingCodes((prev) => new Set([...prev, code]));
      console.log(`[useCompatibilityGoogleDrive] Refreshing images for: ${code}`);

      const images = await findGoogleDriveImages(code);

      setGoogleDriveImages((prev) => ({
        ...prev,
        [code]: images,
      }));

      if (images.length > 0) {
        toast.success(`${images.length} imagem(ns) encontrada(s) no Google Drive`);
      } else {
        toast.info("Nenhuma imagem encontrada no Google Drive para este código");
      }

      return images;
    } catch (error) {
      console.error(`[useCompatibilityGoogleDrive] Error refreshing images for ${code}:`, error);
      toast.error("Erro ao buscar imagens do Google Drive");
      return [];
    } finally {
      setLoadingCodes((prev) => {
        const newSet = new Set(prev);
        newSet.delete(code);
        return newSet;
      });
    }
  }, []);

  /**
   * Get Google Drive images for a code
   */
  const getGoogleDriveImages = useCallback((code: string): string[] => {
    return googleDriveImages[code] || [];
  }, [googleDriveImages]);

  /**
   * Check if images are loading for a code
   */
  const isLoadingForCode = useCallback((code: string): boolean => {
    return loadingCodes.has(code);
  }, [loadingCodes]);

  /**
   * Clear cache for a specific code or all codes
   */
  const clearCache = useCallback((code?: string) => {
    if (code) {
      setGoogleDriveImages((prev) => {
        const newCache = { ...prev };
        delete newCache[code];
        return newCache;
      });
    } else {
      setGoogleDriveImages({});
    }
  }, []);

  return {
    googleDriveImages,
    fetchGoogleDriveImages,
    refreshGoogleDriveImages,
    getGoogleDriveImages,
    isLoadingForCode,
    clearCache,
  };
}
