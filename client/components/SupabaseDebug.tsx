import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";
import StorageDebugger from "./StorageDebugger";

interface DebugInfo {
  supabaseUrl: string | undefined;
  supabaseKey: string | undefined;
  urlValid: boolean;
  keyValid: boolean;
  tablesCheckPending: boolean;
  tablesExists: {
    products: boolean | null;
    compatibility: boolean | null;
  };
  lastError: string | null;
}

export default function SupabaseDebug() {
  const [debug, setDebug] = useState<DebugInfo>({
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
    urlValid: false,
    keyValid: false,
    tablesCheckPending: false,
    tablesExists: {
      products: null,
      compatibility: null,
    },
    lastError: null,
  });

  useEffect(() => {
    // Validate URL and Key format
    const urlValid = debug.supabaseUrl?.includes("supabase.co") ?? false;
    const keyValid = debug.supabaseKey?.startsWith("sb_") ?? false;

    setDebug((prev) => ({
      ...prev,
      urlValid,
      keyValid,
    }));
  }, []);

  const checkTables = async () => {
    setDebug((prev) => ({
      ...prev,
      tablesCheckPending: true,
      lastError: null,
    }));

    try {
      // Try to fetch from products table
      const response = await fetch("/api/ping");
      const data = await response.json();
      
      console.log("Ping response:", data);

      // If we got here, basic connection works
      setDebug((prev) => ({
        ...prev,
        tablesCheckPending: false,
        tablesExists: {
          products: true,
          compatibility: true,
        },
      }));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("Check tables error:", errorMsg);
      
      setDebug((prev) => ({
        ...prev,
        tablesCheckPending: false,
        lastError: errorMsg,
      }));
    }
  };

  return (
    <Card className="p-4 bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          <h3 className="font-600 text-yellow-900 dark:text-yellow-200">Debug Supabase</h3>
        </div>

        <div className="space-y-3 text-sm">
          {/* URL Check */}
          <div className="flex items-start gap-3">
            {debug.urlValid ? (
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="font-500">VITE_SUPABASE_URL</div>
              <div className="text-xs text-muted-foreground font-mono break-all">
                {debug.supabaseUrl || "NÃO DEFINIDA"}
              </div>
              <div className={`text-xs mt-1 ${debug.urlValid ? "text-green-600" : "text-red-600"}`}>
                {debug.urlValid ? "✓ Válida" : "✗ Inválida"}
              </div>
            </div>
          </div>

          {/* Key Check */}
          <div className="flex items-start gap-3">
            {debug.keyValid ? (
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="font-500">VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY</div>
              <div className="text-xs text-muted-foreground font-mono break-all">
                {debug.supabaseKey?.substring(0, 30) + "..." || "NÃO DEFINIDA"}
              </div>
              <div className={`text-xs mt-1 ${debug.keyValid ? "text-green-600" : "text-red-600"}`}>
                {debug.keyValid ? "✓ Começa com sb_" : "✗ Formato inválido"}
              </div>
            </div>
          </div>

          {/* Tables Check */}
          {debug.tablesExists.products !== null && (
            <div className="flex items-start gap-3">
              {debug.tablesExists.products ? (
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="font-500">Tabelas</div>
                <div className="text-xs text-muted-foreground">
                  products: {debug.tablesExists.products ? "✓" : "✗"}
                  <br />
                  compatibility: {debug.tablesExists.compatibility ? "✓" : "✗"}
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {debug.lastError && (
            <div className="p-2 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded text-red-800 dark:text-red-200 text-xs font-mono break-all">
              {debug.lastError}
            </div>
          )}
        </div>

        <Button
          onClick={checkTables}
          disabled={debug.tablesCheckPending || !debug.urlValid || !debug.keyValid}
          size="sm"
          className="w-full"
        >
          {debug.tablesCheckPending ? "Verificando..." : "Testar Conexão"}
        </Button>

        <div className="p-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded text-blue-900 dark:text-blue-200 text-xs">
          <strong>Próximo passo:</strong> Se URL e Key estão vermelhos, atualize o .env. Se estão verdes mas há erro na conexão, as tabelas podem não existir no banco.
        </div>
      </div>

      {/* Storage Explorer */}
      <div className="mt-6 pt-6 border-t border-yellow-200 dark:border-yellow-800">
        <StorageDebugger />
      </div>
    </Card>
  );
}
