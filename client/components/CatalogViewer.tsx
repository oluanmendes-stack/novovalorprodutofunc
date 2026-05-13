import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, Copy } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";

interface CatalogViewerProps {
  productCode: string;
  catalogPath?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CatalogViewer({
  productCode,
  catalogPath: initialCatalogPath,
  open,
  onOpenChange,
}: CatalogViewerProps) {
  const [catalogPath, setCatalogPath] = useState<string | null>(initialCatalogPath ?? null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-fetch catalog path when modal opens
  useEffect(() => {
    if (open && productCode) {
      // Reset and fetch fresh when modal opens
      setCatalogPath(null);
      setErrorMsg(null);
      fetchCatalogPath();
    }
  }, [open, productCode]);

  const fetchCatalogPath = async () => {
    // Dynamically import to avoid circular dependencies if needed
    const { findCatalogFileDirect } = await import("@/lib/supabase");
    const { findGoogleDriveCatalog } = await import("@/services/googleDriveCatalogService");
    const { getCatalogSource } = await import("@/lib/catalogSourceConfig");

    setLoading(true);
    setErrorMsg(null);
    try {
      const source = getCatalogSource();
      console.log(`[CatalogViewer] Searching with source: ${source}`);

      let directPath: string | null = null;
      let googleDrivePath: string | null = null;

      // Try preferred source first
      if (source === 'googledrive') {
        console.log(`[CatalogViewer] Searching in Google Drive first...`);
        googleDrivePath = await findGoogleDriveCatalog(productCode);
        if (googleDrivePath) {
          console.log(`[CatalogViewer] ✓ Found in Google Drive: ${googleDrivePath}`);
          setCatalogPath(googleDrivePath);
        } else {
          console.log(`[CatalogViewer] ✗ Not found in Google Drive, trying Supabase...`);
          directPath = await findCatalogFileDirect(productCode);
          if (directPath) {
            console.log(`[CatalogViewer] ✓ Found in Supabase: ${directPath}`);
            setCatalogPath(directPath);
          } else {
            console.warn(`[CatalogViewer] ✗ No catalog file found for: ${productCode}`);
            setCatalogPath(null);
            setErrorMsg("Arquivo não encontrado no storage (verifique se existe um .doc ou .pdf com o código do produto)");
          }
        }
      } else {
        console.log(`[CatalogViewer] Searching in Supabase first...`);
        directPath = await findCatalogFileDirect(productCode);
        if (directPath) {
          console.log(`[CatalogViewer] ✓ Found in Supabase: ${directPath}`);
          setCatalogPath(directPath);
        } else {
          console.log(`[CatalogViewer] ✗ Not found in Supabase, trying Google Drive...`);
          googleDrivePath = await findGoogleDriveCatalog(productCode);
          if (googleDrivePath) {
            console.log(`[CatalogViewer] ✓ Found in Google Drive: ${googleDrivePath}`);
            setCatalogPath(googleDrivePath);
          } else {
            console.warn(`[CatalogViewer] ✗ No catalog file found for: ${productCode}`);
            setCatalogPath(null);
            setErrorMsg("Arquivo não encontrado no storage (verifique se existe um .doc ou .pdf com o código do produto)");
          }
        }
      }
    } catch (error) {
      console.error("[CatalogViewer] Error searching catalog:", error);
      setCatalogPath(null);
      setErrorMsg(error instanceof Error ? error.message : "Erro ao acessar storage");
    } finally {
      setLoading(false);
    }
  }

  /**
   * Check if the catalog path is a Supabase Storage URL
   */
  const isSupabaseUrl = (url: string): boolean => {
    return url.includes("supabase.co") && url.includes("/storage/");
  };

  /**
   * Check if the catalog path is a Google Drive URL
   */
  const isGoogleDriveUrl = (url: string): boolean => {
    return url.includes("drive.google.com");
  };

  /**
   * Convert Google Drive direct link to a viewer-compatible URL
   */
  const getGoogleDriveViewerUrl = (url: string): string => {
    // Extract file ID from Google Drive URL
    // Format: https://drive.google.com/uc?id=FILE_ID&export=view
    const match = url.match(/[?&]id=([^&]+)/);
    if (match && match[1]) {
      const fileId = match[1];
      // Return format compatible with Google Docs Viewer
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
    return url;
  };

  const handleOpenCatalog = async () => {
    if (!catalogPath) return;

    try {
      let shareUrl: string;

      if (isGoogleDriveUrl(catalogPath)) {
        // For Google Drive URLs, open directly
        shareUrl = catalogPath;
      } else if (isSupabaseUrl(catalogPath)) {
        // For Supabase URLs, open directly
        shareUrl = catalogPath;
      } else {
        // For local paths, use API endpoint
        shareUrl = `${window.location.origin}/api/catalogo/file?catalogPath=${encodeURIComponent(catalogPath)}`;
      }

      window.open(shareUrl, "_blank");
    } catch (err) {
      toast.error("Erro ao abrir catálogo");
    }
  };

  const handleDownload = async () => {
    if (!catalogPath) return;

    try {
      let url: string;

      if (isGoogleDriveUrl(catalogPath)) {
        // For Google Drive URLs, download directly
        url = catalogPath;
      } else if (isSupabaseUrl(catalogPath)) {
        // For Supabase URLs, download directly
        url = catalogPath;
      } else {
        // For local paths, use API endpoint
        url = `/api/catalogo/file?catalogPath=${encodeURIComponent(catalogPath)}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to download catalog");

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = catalogPath.split("/").pop() || "catalogo";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);

      toast.success("Catálogo baixado");
    } catch (err) {
      toast.error("Erro ao baixar catálogo");
    }
  };

  const handleCopyPath = () => {
    if (!catalogPath) return;
    navigator.clipboard.writeText(catalogPath);
    if (isGoogleDriveUrl(catalogPath)) {
      toast.success("URL do Google Drive copiada!");
    } else if (isSupabaseUrl(catalogPath)) {
      toast.success("URL do Supabase copiada!");
    } else {
      toast.success("Caminho do catálogo copiado!");
    }
  };

  const handleCopyShareLink = () => {
    if (!catalogPath) return;

    let shareUrl: string;

    if (isGoogleDriveUrl(catalogPath)) {
      // For Google Drive URLs, copy the URL directly (it's already public)
      shareUrl = catalogPath;
    } else if (isSupabaseUrl(catalogPath)) {
      // For Supabase URLs, copy the URL directly (it's already public)
      shareUrl = catalogPath;
    } else {
      // For local paths, generate API endpoint URL
      shareUrl = `${window.location.origin}/api/catalogo/file?catalogPath=${encodeURIComponent(catalogPath)}`;
    }

    navigator.clipboard.writeText(shareUrl);
    toast.success("Link do catálogo copiado para compartilhar!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Catálogo do Produto - {productCode}</DialogTitle>
          <DialogDescription>Visualizar, baixar e compartilhar catálogo do produto</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-muted-foreground">Buscando catálogo...</p>
          </div>
        ) : !catalogPath ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <p className="text-muted-foreground font-medium text-center">Nenhum catálogo encontrado para <strong>{productCode}</strong></p>
            {errorMsg && (
              <p className="text-xs text-red-500 bg-red-50 p-2 rounded border border-red-100 max-w-md break-all">
                {errorMsg}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2 max-w-md text-center">
              Procuramos por arquivos com nomes como:<br/>
              <code className="bg-muted px-2 py-1 rounded text-xs">{productCode}.doc</code>,{" "}
              <code className="bg-muted px-2 py-1 rounded text-xs">{productCode}.docx</code>,{" "}
              <code className="bg-muted px-2 py-1 rounded text-xs">{productCode}.pdf</code>
            </p>
            <Button variant="ghost" size="sm" onClick={() => fetchCatalogPath()} className="mt-2">Tentar novamente</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Document preview using Microsoft Office Online Viewer or direct link */}
            <div className="w-full bg-background border border-border rounded-lg overflow-hidden">
              {catalogPath.endsWith('.pdf') ? (
                // PDF files - use Google Drive embedded preview
                <iframe
                  src={isGoogleDriveUrl(catalogPath) ? getGoogleDriveViewerUrl(catalogPath) : `https://docs.google.com/gvjs?url=${encodeURIComponent(isSupabaseUrl(catalogPath) ? catalogPath : `${window.location.origin}/api/catalogo/file?catalogPath=${encodeURIComponent(catalogPath)}`)}`}
                  className="w-full h-96 border-none"
                  title="Visualizador de Catálogo"
                  loading="lazy"
                  allow="fullscreen"
                />
              ) : (
                // Word documents (.doc, .docx) - use Microsoft Office Online Viewer
                <iframe
                  src={isGoogleDriveUrl(catalogPath) ? getGoogleDriveViewerUrl(catalogPath) : `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(isSupabaseUrl(catalogPath) ? catalogPath : `${window.location.origin}/api/catalogo/file?catalogPath=${encodeURIComponent(catalogPath)}`)}`}
                  className="w-full h-96 border-none"
                  title="Visualizador de Catálogo"
                  loading="lazy"
                  allowFullScreen
                />
              )}
            </div>

            {/* Catalog info */}
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Arquivo</p>
                <p className="font-500 text-foreground break-all">
                  {catalogPath.split("/").pop()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Caminho Completo
                </p>
                <p className="text-xs text-muted-foreground break-all font-mono bg-background p-2 rounded">
                  {catalogPath}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={handleOpenCatalog}
                className="gap-2 flex-1"
                disabled={loading}
              >
                <ExternalLink className="w-4 h-4" />
                Abrir em Nova Aba
              </Button>
              <Button
                variant="outline"
                onClick={handleDownload}
                className="gap-2 flex-1"
                disabled={loading}
              >
                <Download className="w-4 h-4" />
                Baixar
              </Button>
            </div>

            {/* Copy options */}
            <div className="space-y-2 pt-2 border-t border-border">
              <p className="text-sm text-muted-foreground font-500">
                Compartilhamento
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyShareLink}
                  className="gap-2 flex-1"
                  disabled={loading}
                >
                  <Copy className="w-4 h-4" />
                  Copiar Link de Compartilhamento
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
