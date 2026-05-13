import { useState, useEffect } from "react";
import { useImages } from "@/hooks/useImages";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight, Download, ExternalLink, Link as LinkIcon, Copy, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface ImageViewerProps {
  productCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ImageViewer({
  productCode,
  open,
  onOpenChange,
}: ImageViewerProps) {
  const { images, loading, findImages, openImage, rejectImage } = useImages();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Load images when dialog opens or product code changes
  // Always reset and refetch images when modal opens
  useEffect(() => {
    if (open) {
      setCurrentIndex(0);
      // Force fresh search by calling findImages
      findImages(productCode);
    }
  }, [open, productCode]);

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
  };

  const currentImage = images[currentIndex];

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleOpenImage = async () => {
    if (currentImage) {
      await openImage(currentImage);
    }
  };

  const handleDownload = async () => {
    if (!currentImage) return;

    try {
      const response = await fetch(currentImage);
      if (!response.ok) throw new Error("Failed to download image");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = currentImage.split("/").pop() || "image";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Imagem baixada");
    } catch (err) {
      toast.error("Erro ao baixar imagem");
    }
  };

  const handleCopyShareLink = () => {
    if (!currentImage) return;

    const shareUrl = `${window.location.origin}${currentImage}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copiado para clipboard!");
  };

  const handleReject = () => {
    if (!currentImage) return;
    rejectImage(productCode, currentImage);
    // If we're at the end of the list and we rejected it, move back one
    // or to 0 if none left
    if (currentIndex >= images.length - 1) {
      setCurrentIndex(Math.max(0, images.length - 2));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-4">
        <DialogHeader>
          <DialogTitle>Fotos do Produto - {productCode}</DialogTitle>
          <DialogDescription>Visualizar e gerenciar fotos do produto</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <p className="text-muted-foreground">Carregando imagens...</p>
          </div>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 gap-4">
            <div className="flex flex-col items-center justify-center gap-2">
              <p className="text-muted-foreground font-medium">Nenhuma imagem encontrada</p>
              <p className="text-xs text-muted-foreground text-center max-w-md">
                Procuramos por imagens com o código <strong>{productCode}</strong> em várias pastas do Supabase Storage.
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-800 max-w-md text-center">
              <p className="font-medium mb-1">💡 Dica:</p>
              <p>Verifique no console do navegador (F12) para ver logs detalhados da busca.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 flex-1 overflow-hidden">
            {/* Main image display */}
            <div className="flex items-center justify-center bg-muted rounded-lg overflow-hidden flex-1 max-h-[calc(90vh-300px)]">
              {currentImage && (
                <>
                  <img
                    src={currentImage}
                    alt={`Produto ${productCode} - Imagem ${currentIndex + 1}`}
                    className="max-w-full max-h-full object-contain p-2"
                    onLoad={(e) => {
                      console.log(`[ImageViewer] ✅ Imagem carregada com sucesso`);
                      console.log(`[ImageViewer]    URL: ${currentImage}`);
                    }}
                    onError={(e) => {
                      console.error(`[ImageViewer] ❌ Erro ao carregar imagem`);
                      console.error(`[ImageViewer]    URL: ${currentImage}`);
                      console.error(`[ImageViewer]    Status: ${(e.target as any).status}`);

                      // Handle missing images gracefully
                      const img = e.target as HTMLImageElement;
                      img.style.display = 'none';
                      const container = img.parentElement;
                      if (container && !container.querySelector('[data-error-shown]')) {
                        const errorDiv = document.createElement('div');
                        errorDiv.setAttribute('data-error-shown', 'true');
                        errorDiv.className = 'flex flex-col items-center justify-center h-96 text-muted-foreground';
                        errorDiv.innerHTML = `
                          <div class="text-center space-y-3">
                            <p><strong>Erro ao carregar imagem</strong></p>
                            <p class="text-xs break-all max-w-md">URL: ${currentImage}</p>
                            <p class="text-xs text-orange-600">Problema de carregamento via proxy</p>
                            <p class="text-xs text-gray-500">Verifique o console (F12) para mais detalhes</p>
                          </div>
                        `;
                        container.appendChild(errorDiv);
                      }
                    }}
                  />
                </>
              )}
            </div>

            {/* Image navigation and info */}
            <div className="space-y-4">
              {/* Counter and navigation buttons */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {currentIndex + 1} de {images.length}
                </span>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNext}
                    disabled={currentIndex === images.length - 1}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyShareLink}
                    className="gap-2"
                    title="Copiar link para compartilhar com cliente"
                  >
                    <Copy className="w-4 h-4" />
                    <span className="hidden sm:inline">Link</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Baixar</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenImage}
                    className="gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="hidden sm:inline">Abrir</span>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleReject}
                    className="gap-2"
                    title="Ocultar esta foto para este produto"
                  >
                    <EyeOff className="w-4 h-4" />
                    <span className="hidden sm:inline">Ocultar</span>
                  </Button>
                </div>
              </div>

              {/* Image thumbnails */}
              <ScrollArea className="w-full">
                <div className="flex gap-2 pb-4">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`flex-shrink-0 border-2 rounded transition-colors ${
                        index === currentIndex
                          ? "border-primary"
                          : "border-transparent hover:border-muted-foreground"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-16 h-16 object-cover rounded bg-muted"
                        loading="lazy"
                        onError={(e) => {
                          // Show placeholder for failed images
                          const target = e.target as HTMLImageElement;
                          target.style.opacity = '0.3';
                          console.warn(`[ImageViewer] ⚠️ Thumbnail falhou ao carregar: ${image.substring(0, 80)}`);
                        }}
                      />
                    </button>
                  ))}
                </div>
              </ScrollArea>

              {/* File path info */}
              <div className="bg-muted p-3 rounded text-xs text-muted-foreground break-all">
                {currentImage}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
