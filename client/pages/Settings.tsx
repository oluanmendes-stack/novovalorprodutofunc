import { useState } from "react";
import Layout from "@/components/Layout";
import SupabaseConfig from "@/components/SupabaseConfig";
import ImportExportProducts from "@/components/ImportExportProducts";
import ImageSourceConfig from "@/components/ImageSourceConfig";
import CatalogSourceConfig from "@/components/CatalogSourceConfig";
import { useProducts } from "@/hooks/useProducts";
import { Card } from "@/components/ui/card";
import { Settings, Database, Package, Image, FileText } from "lucide-react";

export default function SettingsPage() {
  const { products, refetch } = useProducts();

  const handleImportSuccess = () => {
    refetch();
  };

  const handleDeleteSuccess = () => {
    refetch();
  };

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Settings className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Configurações
            </h1>
          </div>
          <p className="text-muted-foreground">
            Gerencie as configurações da aplicação e do banco de dados
          </p>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Supabase Configuration */}
          <div className="lg:col-span-1">
            <SupabaseConfig />
          </div>

          {/* Products Management */}
          <div className="lg:col-span-1">
            <ImportExportProducts
              products={products}
              onImport={handleImportSuccess}
              onDelete={handleDeleteSuccess}
            />
          </div>

          {/* Image Source Configuration */}
          <div className="lg:col-span-1">
            <ImageSourceConfig />
          </div>

          {/* Catalog Source Configuration */}
          <div className="lg:col-span-1">
            <CatalogSourceConfig />
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6 border-primary/20">
            <div className="flex items-start gap-3">
              <Database className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Banco de Dados</h3>
                <p className="text-sm text-muted-foreground">
                  Configure suas credenciais do Supabase para conectar ao banco
                  de dados de produtos. As informações são armazenadas localmente
                  em desenvolvimento.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-secondary/20">
            <div className="flex items-start gap-3">
              <Package className="w-5 h-5 text-secondary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Gerenciar Produtos</h3>
                <p className="text-sm text-muted-foreground">
                  Importe, exporte e delete produtos em lote usando arquivos CSV.
                  Suporta múltiplos formatos de coluna para maior flexibilidade.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Catálogos no Google Drive</h3>
                <p className="text-sm text-muted-foreground">
                  Armazene catálogos de produtos no Google Drive. A aplicação
                  procura automaticamente por arquivos PDF ou Word que correspondem
                  ao código do produto na pasta configurada.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Environment Variables Info */}
        <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-amber-200 dark:border-amber-800">
          <h3 className="font-semibold mb-3 text-amber-900 dark:text-amber-100">
            Configuração em Produção
          </h3>
          <div className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
            <p>
              Para que a aplicação funcione corretamente no Netlify ou Vercel,
              você precisa configurar as seguintes variáveis de ambiente:
            </p>
            <ul className="list-disc list-inside space-y-1 font-mono text-xs">
              <li>VITE_SUPABASE_URL</li>
              <li>VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY</li>
              <li>SUPABASE_URL</li>
              <li>SUPABASE_KEY</li>
              <li>VITE_GOOGLE_DRIVE_API_KEY</li>
              <li>VITE_GOOGLE_DRIVE_FOLDER_ID</li>
            </ul>
            <p className="mt-3">
              Acesse o painel de sua plataforma de hospedagem (Netlify/Vercel),
              vá para "Environment Variables" e adicione essas variáveis com
              seus valores correspondentes.
            </p>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
