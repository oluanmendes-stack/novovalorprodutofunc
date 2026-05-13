import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  getCatalogSource, 
  setCatalogSource, 
  isGoogleDriveAvailableForCatalogs, 
  isSupabaseAvailableForCatalogs 
} from "@/lib/catalogSourceConfig";
import { clearGoogleDriveCatalogCache } from "@/services/googleDriveCatalogService";
import { FileText, Cloud, HardDrive, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function CatalogSourceConfig() {
  const [currentSource, setCurrentSource] = useState<'supabase' | 'googledrive'>('supabase');
  const [googleDriveAvailable, setGoogleDriveAvailable] = useState(false);
  const [supabaseAvailable, setSupabaseAvailable] = useState(false);

  useEffect(() => {
    setCurrentSource(getCatalogSource());
    setGoogleDriveAvailable(isGoogleDriveAvailableForCatalogs());
    setSupabaseAvailable(isSupabaseAvailableForCatalogs());
  }, []);

  const handleSourceChange = (source: 'supabase' | 'googledrive') => {
    setCatalogSource(source);
    setCurrentSource(source);
    clearGoogleDriveCatalogCache();
    toast.success(`Fonte de catálogos alterada para ${source === 'googledrive' ? 'Google Drive' : 'Supabase'}`);
  };

  const handleClearCache = () => {
    clearGoogleDriveCatalogCache();
    toast.success("Cache de catálogos limpo");
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Origem dos Catálogos</h3>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Escolha de onde buscar os catálogos dos produtos. Os catálogos podem vir do Google Drive ou do Supabase Storage.
        </p>

        {/* Options */}
        <div className="space-y-3">
          {/* Google Drive Option */}
          <button
            onClick={() => googleDriveAvailable && handleSourceChange('googledrive')}
            disabled={!googleDriveAvailable}
            className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
              currentSource === 'googledrive' && googleDriveAvailable
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                : 'border-border hover:border-primary/50'
            } ${!googleDriveAvailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-center gap-3">
              <Cloud className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-500">Google Drive</p>
                <p className="text-xs text-muted-foreground">
                  {googleDriveAvailable
                    ? 'Conectado e pronto para usar'
                    : 'Não configurado (falta variável de ambiente)'}
                </p>
              </div>
              {currentSource === 'googledrive' && googleDriveAvailable && (
                <div className="w-2 h-2 rounded-full bg-blue-500" />
              )}
            </div>
          </button>

          {/* Supabase Option */}
          <button
            onClick={() => supabaseAvailable && handleSourceChange('supabase')}
            disabled={!supabaseAvailable}
            className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
              currentSource === 'supabase' && supabaseAvailable
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                : 'border-border hover:border-primary/50'
            } ${!supabaseAvailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-center gap-3">
              <HardDrive className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-500">Supabase Storage</p>
                <p className="text-xs text-muted-foreground">
                  {supabaseAvailable
                    ? 'Conectado e pronto para usar'
                    : 'Não configurado'}
                </p>
              </div>
              {currentSource === 'supabase' && supabaseAvailable && (
                <div className="w-2 h-2 rounded-full bg-blue-500" />
              )}
            </div>
          </button>
        </div>

        {/* Clear Cache Button */}
        <div className="pt-4 border-t border-border">
          <Button
            onClick={handleClearCache}
            variant="outline"
            size="sm"
            className="gap-2 w-full"
          >
            <RefreshCw className="w-4 h-4" />
            Limpar Cache de Catálogos
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Limpa o cache local de catálogos. Use se os catálogos não aparecerem corretamente.
          </p>
        </div>

        {/* Configuration Info */}
        <div className="mt-6 pt-6 border-t border-border space-y-3">
          <p className="text-sm font-500">Configuração do Google Drive</p>
          <div className="bg-muted/50 p-3 rounded text-xs text-muted-foreground font-mono space-y-1">
            <p>Variável de ambiente necessária:</p>
            <p className="text-primary">VITE_GOOGLE_DRIVE_API_KEY</p>
          </div>
          <p className="text-xs text-muted-foreground">
            O Google Drive deve ter os catálogos organizados em pastas. Os arquivos de catálogo (PDF, DOCX, DOC) devem ter o código do produto no nome para serem encontrados automaticamente.
          </p>
        </div>
      </div>
    </Card>
  );
}
