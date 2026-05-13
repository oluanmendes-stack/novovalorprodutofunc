import { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import ProductSearch from "@/components/ProductSearch";
import ImageViewer from "@/components/ImageViewer";
import CatalogViewer from "@/components/CatalogViewer";
import SupabaseDebug from "@/components/SupabaseDebug";
import { getCatalogStorageUrl } from "@/lib/supabase-storage";
import { useProducts, type Product } from "@/hooks/useProducts";
import { useConfig } from "@/hooks/useConfig";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getDescriptor } from "@/services/catalogService";
import {
  Copy,
  Eye,
  FileText,
  Package,
  Search,
  DollarSign,
  Settings,
  TrendingUp,
  Share2,
} from "lucide-react";
import { toast } from "sonner";

// Format price in Brazilian format (with comma for cents)
const formatPrice = (price: number): string => {
  return price.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Get manufacturers based on product code
const getManufacturers = (code: string): string[] => {
  // GABMED only for specific codes
  if (code === "HD-00970" || code === "TP-00971") {
    return ["GABMED"];
  }

  // Contec only for specific codes
  if (code === "ECG300G") {
    return ["Contec"];
  }

  // Med-Link for all other codes
  return ["Med-Link"];
};

export default function Index() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [catalogViewerOpen, setCatalogViewerOpen] = useState(false);
  const { products, loading, refetch } = useProducts();
  const { isConfigured } = useConfig();

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    toast.success(`Produto selecionado: ${product.code}`);
    // Automatically load images when product is selected
    // Note: This will be displayed when user clicks the image viewer button
  };

  const handleCopyCode = () => {
    if (selectedProduct) {
      navigator.clipboard.writeText(selectedProduct.code);
      toast.success("Código copiado para clipboard!");
    }
  };

  const handleCopyDescription = () => {
    if (selectedProduct) {
      navigator.clipboard.writeText(selectedProduct.description);
      toast.success("Descrição copiada para clipboard!");
    }
  };

  const handleCopyDescriptor = async () => {
    if (!selectedProduct) {
      toast.error("Selecione um produto primeiro");
      return;
    }

    try {
      const descriptorData = await getDescriptor(selectedProduct.code);

      if (!descriptorData || !descriptorData.descriptor) {
        toast.error(`Descritivo não encontrado para ${selectedProduct.code}`);
        return;
      }

      await navigator.clipboard.writeText(descriptorData.descriptor);
      toast.success("Descritivo copiado para clipboard!");
    } catch (error) {
      console.error("Error fetching descriptor:", error);
      toast.error("Erro ao buscar descritivo");
    }
  };

  const handleCopyAnvisa = async () => {
    if (!selectedProduct) {
      toast.error("Selecione um produto primeiro");
      return;
    }

    try {
      const descriptorData = await getDescriptor(selectedProduct.code);

      if (!descriptorData || !descriptorData.registration) {
        toast.error(`Registro ANVISA não encontrado para ${selectedProduct.code}`);
        return;
      }

      await navigator.clipboard.writeText(descriptorData.registration);
      toast.success(`ANVISA ${descriptorData.registration} copiado!`);
    } catch (error) {
      console.error("Error fetching ANVISA registration:", error);
      toast.error("Erro ao buscar registro ANVISA");
    }
  };

  const handleOpenImages = () => {
    if (!selectedProduct) {
      toast.error("Selecione um produto primeiro");
      return;
    }
    setImageViewerOpen(true);
  };

  const handleOpenCatalog = () => {
    if (!selectedProduct) {
      toast.error("Selecione um produto primeiro");
      return;
    }
    setCatalogViewerOpen(true);
  };

  const handleCopyCatalogShareLink = () => {
    if (!selectedProduct) {
      toast.error("Selecione um produto primeiro");
      return;
    }

    const shareUrl = getCatalogStorageUrl(selectedProduct.code);
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link do catálogo copiado para compartilhar com cliente!");
  };

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        {/* Debug Component - Mostrado se houver erro */}
        {loading && products.length === 0 && (
          <SupabaseDebug />
        )}

        {/* Header */}
        <div className="space-y-4">
          <div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Dashboard de Gestão
            </h1>
            <p className="text-muted-foreground mt-2">
              Sistema completo de preços, catálogos e documentos
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-500">
                    Produtos Carregados
                  </p>
                  <p className="text-2xl sm:text-3xl font-700 text-foreground mt-1">
                    {products.length}
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Package className="w-6 h-6 text-primary" />
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-500">
                    Preço Médio
                  </p>
                  <p className="text-2xl sm:text-3xl font-700 text-foreground mt-1">
                    {products.length > 0
                      ? formatPrice(
                          products.reduce((sum, p) => sum + p.price, 0) /
                          products.length
                        )
                      : "0,00"}
                  </p>
                </div>
                <div className="p-3 bg-secondary/10 rounded-lg">
                  <DollarSign className="w-6 h-6 text-secondary" />
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-500">
                    Maior Preço
                  </p>
                  <p className="text-2xl sm:text-3xl font-700 text-foreground mt-1">
                    {products.length > 0
                      ? formatPrice(Math.max(...products.map((p) => p.price)))
                      : "0,00"}
                  </p>
                </div>
                <div className="p-3 bg-accent/10 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-accent" />
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-500">
                    Configurado
                  </p>
                  <p className="text-2xl sm:text-3xl font-700 text-accent mt-1">
                    {localStorage.getItem("pricePdfPath") ? "✓" : "×"}
                  </p>
                </div>
                <Link to="/settings">
                  <div className="p-3 bg-muted rounded-lg hover:bg-muted cursor-pointer transition">
                    <Settings className="w-6 h-6 text-muted-foreground" />
                  </div>
                </Link>
              </div>
            </Card>
          </div>
        </div>

        {/* Search and Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Search Section */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-6">
              <h2 className="text-lg font-600 mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-primary" />
                Buscar Produto
              </h2>
              <ProductSearch
                products={products}
                onSelect={handleSelectProduct}
              />
              <p className="text-xs text-muted-foreground mt-4">
                Digite o código do produto ou parte da descrição. Suporta
                pesquisa parcial.
              </p>
            </Card>

            {/* Selected Product */}
            {selectedProduct && (
              <Card className="p-6 border-2 border-primary animate-slide-in">
                <h3 className="text-lg font-600 mb-4">Detalhes do Produto</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Código
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="font-600 text-lg text-foreground">
                          {selectedProduct.code}
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCopyCode}
                          className="h-8 w-8 p-0"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Fabricante
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {getManufacturers(selectedProduct.code).map(
                          (manufacturer) => (
                            <span
                              key={manufacturer}
                              className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-600 rounded-full"
                            >
                              {manufacturer}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Descrição
                    </p>
                    <div className="flex items-start gap-2">
                      <p className="font-500 text-foreground flex-1">
                        {selectedProduct.description}
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCopyDescription}
                        className="h-8 w-8 p-0 flex-shrink-0"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Preço Unit. Distribuidor sem IPI
                      </p>
                      <p className="text-lg font-600 text-foreground">
                        R$ {formatPrice(selectedProduct.distributorPrice || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Preço Unit. Distribuidor c/ IPI
                      </p>
                      <p className="text-2xl font-700 text-primary">
                        R$ {formatPrice(selectedProduct.price)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Preço Unit. Final sem IPI
                      </p>
                      <p className="text-lg font-600 text-foreground">
                        R$ {formatPrice(selectedProduct.finalPrice || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Preço Unit. Final c/ IPI
                      </p>
                      <p className="text-2xl font-700 text-secondary">
                        R$ {formatPrice(selectedProduct.priceWithIPI)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">X3</p>
                      <p className="text-xl font-700 text-accent">
                        R$ {formatPrice(selectedProduct.distributorPrice * 3 || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        X3 c/ IPI
                      </p>
                      <p className="text-xl font-700 text-accent">
                        R$ {formatPrice(selectedProduct.price * 3)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-3 gap-2 mt-6 pt-6 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={handleOpenImages}
                    title="Ver fotos do produto"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">Foto</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={handleCopyDescriptor}
                    title="Copiar descritivo"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">Descritivo</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={handleCopyAnvisa}
                    title="Copiar número ANVISA"
                  >
                    <Copy className="w-4 h-4" />
                    <span className="hidden sm:inline">ANVISA</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={handleOpenCatalog}
                    title="Ver catálogo do produto"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">Catálogo</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={handleCopyCatalogShareLink}
                    title="Copiar link de compartilhamento do catálogo"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Link Cat.</span>
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* Quick Actions Sidebar */}
          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-600 mb-4">Ações Rápidas</h3>
              <div className="space-y-3">
                <Link to="/batch" className="block">
                  <Button className="w-full justify-start gap-2 bg-primary hover:bg-primary/90">
                    <Package className="w-4 h-4" />
                    Novo Lote
                  </Button>
                </Link>
                <Link to="/documents" className="block">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Gerar Relatório
                  </Button>
                </Link>
                <Link to="/settings" className="block">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Configurações
                  </Button>
                </Link>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
              <h3 className="font-600 mb-2">Dica</h3>
              <p className="text-sm text-muted-foreground">
                Configure os caminhos de arquivo na seção de Configurações para
                ativar todas as funcionalidades do sistema.
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Image Viewer Modal */}
      {selectedProduct && (
        <ImageViewer
          productCode={selectedProduct.code}
          open={imageViewerOpen}
          onOpenChange={setImageViewerOpen}
        />
      )}

      {/* Catalog Viewer Modal */}
      {selectedProduct && (
        <CatalogViewer
          productCode={selectedProduct.code}
          catalogPath={getCatalogStorageUrl(selectedProduct.code)}
          open={catalogViewerOpen}
          onOpenChange={setCatalogViewerOpen}
        />
      )}
    </Layout>
  );
}
