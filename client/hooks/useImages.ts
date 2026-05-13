import { useState, useCallback } from "react";
import { toast } from "sonner";
import { findImagesFlexible, getImageUrl as getImageUrlFromService } from "@/services/imageService";

export interface ProductImage {
  path: string;
  filename: string;
}

export function useImages() {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load rejected images from local storage
  const getRejectedImages = useCallback((): Record<string, string[]> => {
    try {
      return JSON.parse(localStorage.getItem('rejected_product_images') || '{}');
    } catch {
      return {};
    }
  }, []);

  /**
   * Find images for a product code
   * Generates URLs directly from Supabase Storage
   * No validation - the browser will handle image loading and errors
   */
  const findImages = useCallback(async (code: string): Promise<string[]> => {
    console.log(`[useImages] 🔍 INICIANDO BUSCA PARA: ${code}`);

    if (!code || code.trim() === "") {
      setError("Product code is required");
      return [];
    }

    setLoading(true);
    setError(null);
    setImages([]);

    try {
      console.log(`[useImages] Chamando findImagesFlexible para: ${code}`);
      const imageUrls = await findImagesFlexible(code);
      console.log(`[useImages] ✅ Generated ${imageUrls.length} image URLs for ${code}`);

      if (imageUrls.length === 0) {
        const message = `Nenhuma URL gerada para o código "${code}".`;
        setError(message);
        console.info(`No image URLs generated for product: ${code}`);
        setLoading(false);
        return [];
      }

      // Filter out rejected images
      const rejected = getRejectedImages();
      const rejectedForCode = rejected[code] || [];
      const filteredUrls = imageUrls.filter(url => !rejectedForCode.includes(url));

      if (filteredUrls.length === 0 && imageUrls.length > 0) {
        // All images were rejected
        console.info(`All generated URLs were explicitly hidden by user for product: ${code}`);
      }

      // Set all generated URLs - let the browser handle loading and display errors for each
      setImages(filteredUrls);
      console.log(`[useImages] Ready to load ${filteredUrls.length} images for ${code}`);

      return filteredUrls;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao buscar imagens";
      setError(errorMessage);
      console.error(`Error searching for images of ${code}:`, err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Open an image file
   * Note: In web browsers, we can only open images in a new tab/window
   */
  const openImage = useCallback(async (imagePath: string): Promise<void> => {
    if (!imagePath) {
      setError("Image path is required");
      return;
    }

    try {
      // Open image in a new tab/window
      window.open(imagePath, "_blank");
      toast.success("Imagem aberta em nova aba");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to open image";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, []);

  /**
   * Get image file URL for display
   * Since images are static, just return the path directly
   */
  const getImageUrl = useCallback((imagePath: string): string => {
    return getImageUrlFromService(imagePath);
  }, []);

  /**
   * Mark an image as incorrect for a product code so it won't be shown again
   */
  const rejectImage = useCallback((code: string, imageUrl: string) => {
    if (!code || !imageUrl) return;
    
    try {
      const rejected = getRejectedImages();
      if (!rejected[code]) {
        rejected[code] = [];
      }
      
      if (!rejected[code].includes(imageUrl)) {
        rejected[code].push(imageUrl);
        localStorage.setItem('rejected_product_images', JSON.stringify(rejected));
        
        // Remove from current view
        setImages(prev => {
          const newImages = prev.filter(img => img !== imageUrl);
          return newImages;
        });
        
        toast.success("Foto ocultada. Não será mais exibida para este produto.");
      }
    } catch (err) {
      console.error("Error rejecting image:", err);
      toast.error("Erro ao ocultar foto");
    }
  }, [getRejectedImages]);

  return {
    images,
    loading,
    error,
    findImages,
    openImage,
    getImageUrl,
    rejectImage,
  };
}
