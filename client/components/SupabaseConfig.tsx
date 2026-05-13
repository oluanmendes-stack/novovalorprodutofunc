import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function SupabaseConfig() {
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseKey, setSupabaseKey] = useState("");
  const [showUrl, setShowUrl] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load from localStorage if available
    const savedUrl = localStorage.getItem("supabase_url") || "";
    const savedKey = localStorage.getItem("supabase_key") || "";
    setSupabaseUrl(savedUrl);
    setSupabaseKey(savedKey);
    setIsLoaded(true);
  }, []);

  const handleSave = async () => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      toast.error("URL e chave do Supabase são obrigatórios");
      return;
    }

    if (!supabaseUrl.includes("supabase.co")) {
      toast.error("URL do Supabase inválida. Deve conter 'supabase.co'");
      return;
    }

    setIsSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem("supabase_url", supabaseUrl);
      localStorage.setItem("supabase_key", supabaseKey);

      // Note: In production, these should be set as environment variables
      // The app will use these values for client-side operations
      toast.success("Configurações do Supabase salvas localmente!");
    } catch (error) {
      console.error("Error saving config:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    const confirmed = window.confirm(
      "Tem certeza que deseja limpar as configurações do Supabase?"
    );
    if (!confirmed) return;

    localStorage.removeItem("supabase_url");
    localStorage.removeItem("supabase_key");
    setSupabaseUrl("");
    setSupabaseKey("");
    toast.success("Configurações limpas");
  };

  if (!isLoaded) {
    return <div>Carregando...</div>;
  }

  return (
    <Card className="p-6 border-primary/20">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Configuração Supabase</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Defina suas credenciais do Supabase para conectar ao banco de dados
            de produtos
          </p>
        </div>

        {/* Info Box */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Nota:</strong> Para o ambiente de produção (Netlify/Vercel),
            configure as variáveis de ambiente diretamente na plataforma de
            hospedagem. Os valores aqui são usados apenas para desenvolvimento
            local.
          </p>
        </div>

        {/* Supabase URL */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            URL do Supabase
          </label>
          <div className="relative">
            <Input
              type={showUrl ? "text" : "password"}
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://xxxxx.supabase.co"
              className="pr-10"
            />
            <button
              onClick={() => setShowUrl(!showUrl)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showUrl ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Exemplo: https://hmjbpsohkzkguixwafov.supabase.co
          </p>
        </div>

        {/* Supabase Key */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Chave Pública do Supabase
          </label>
          <div className="relative">
            <Input
              type={showKey ? "text" : "password"}
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              placeholder="sb_publishable_xxxxx"
              className="pr-10"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showKey ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Use a chave pública (publishable/anon), não a chave secreta
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            {isSaving ? "Salvando..." : "Salvar Configurações"}
          </Button>
          <Button
            onClick={handleClear}
            disabled={isSaving}
            variant="outline"
            className="flex-1"
          >
            Limpar
          </Button>
        </div>

        {/* Help Section */}
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">Como encontrar suas credenciais:</p>
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Acesse o painel do Supabase</li>
            <li>Vá para Settings → API</li>
            <li>Copie a URL do projeto</li>
            <li>Copie a chave pública (anon/public key)</li>
          </ol>
        </div>
      </div>
    </Card>
  );
}
