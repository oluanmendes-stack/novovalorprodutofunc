import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import BatchReport from "@/components/BatchReport";
import ImageViewer from "@/components/ImageViewer";
import CatalogViewer from "@/components/CatalogViewer";
import CompatibilityMini from "@/components/CompatibilityMini";
import { useSupabaseBatch, type Lote } from "@/hooks/useSupabaseBatch";
import { useSupabaseProducts } from "@/hooks/useSupabaseProducts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getCatalogStorageUrl } from "@/lib/supabase-storage";
import { getDescriptor } from "@/services/catalogService";
import {
  Plus,
  Trash2,
  DownloadCloud,
  AlertCircle,
  Package,
  Zap,
  Eye,
  X,
  Copy,
  FileText,
  Share2,
} from "lucide-react";
import { toast } from "sonner";

const STORAGE_KEY = "batch_lotes_data";

export default function Batch() {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedProductCode, setSelectedProductCode] = useState<string | null>(null);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [catalogViewerOpen, setCatalogViewerOpen] = useState(false);
  const [multiplier, setMultiplier] = useState(3);
  const { products } = useSupabaseProducts();
  const { generateReport, exportPDF, exportExcel } = useSupabaseBatch();

  // Load data from localStorage on mount
  useEffect(() => {
    const savedLotes = localStorage.getItem(STORAGE_KEY);
    if (savedLotes) {
      try {
        const parsed = JSON.parse(savedLotes);
        setLotes(parsed);
      } catch (error) {
        console.error("Erro ao carregar lotes salvos:", error);
      }
    }
  }, []);

  // Save to localStorage whenever lotes change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lotes));
  }, [lotes]);

  const parseLotes = (text: string) => {
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const parsed: Lote[] = [];

    for (const line of lines) {
      // Format: 1 - CODIGO1 + CODIGO2 or Lote-1 - CODIGO1 + CODIGO2
      const match = line.match(/^(.+?)\s*-\s*(.+)$/);
      if (match) {
        const [, loteNumberRaw, codesStr] = match;
        let loteNumber = loteNumberRaw.trim();

        // Extract just the number if format is "Lote-1" or similar
        const numberMatch = loteNumber.match(/\d+$/);
        if (numberMatch) {
          loteNumber = numberMatch[0];
        }

        const codes = codesStr
          .split("+")
          .map((code) => {
            let cleanCode = code.trim();
            // Remove item number prefix like "1-", "2-", etc from individual codes
            cleanCode = cleanCode.replace(/^\d+\s*-\s*/, "").trim();
            return cleanCode;
          })
          .filter((code) => code.length > 0);

        if (codes.length > 0) {
          parsed.push({
            id: `lote-${Date.now()}-${Math.random()}`,
            number: loteNumber,
            codes,
            quantity: 1,
            totalPrice: 0, // Would be calculated with actual product data
          });
        }
      }
    }

    return parsed;
  };

  const handleLoadAllProducts = () => {
    if (products.length === 0) {
      toast.error("Nenhum produto disponível");
      return;
    }

    const allProductLote: Lote = {
      id: `lote-${Date.now()}`,
      number: `Todos os Produtos (${products.length})`,
      codes: products.map((p) => p.code),
      quantity: 1,
      totalPrice: 0,
    };

    setLotes([allProductLote]);
    toast.success(
      `${products.length} produto(s) carregado(s) em um único lote!`
    );
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);

    // Generate suggestions based on current input
    if (value.trim().length > 0) {
      const lastLine = value.split("\n").pop() || "";
      const lastPart = lastLine.split("+").pop() || "";

      if (lastPart.trim().length > 0) {
        // Remove number prefix like "1 -", "1-", "ODM-" etc and get the actual search term
        let searchTerm = lastPart.trim();

        // Remove item number at the beginning (e.g., "1 - " or "1-")
        searchTerm = searchTerm.replace(/^\d+\s*-\s*/, "").trim().toUpperCase();

        if (searchTerm.length > 0) {
          const matching = products
            .filter(
              (p) =>
                p.code.toUpperCase().includes(searchTerm) ||
                p.description.toUpperCase().includes(searchTerm)
            )
            .slice(0, 8);

          setSuggestions(matching);
          setShowSuggestions(matching.length > 0);
        } else {
          setShowSuggestions(false);
        }
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (product: any) => {
    const lines = inputValue.split("\n");
    const lastLine = lines[lines.length - 1];
    const lastPart = lastLine.split("+");
    const lastCodePart = lastPart[lastPart.length - 1].trim();

    // Check if there's a number prefix like "1 -" or "1-"
    const numberMatch = lastCodePart.match(/^(\d+\s*-\s*)/);
    const numberPrefix = numberMatch ? numberMatch[1] : "";

    // Replace the last part with the number prefix + clean code
    lastPart[lastPart.length - 1] = numberPrefix + product.code;
    lines[lines.length - 1] = lastPart.join(" + ");

    const newValue = lines.join("\n") + " + ";
    setInputValue(newValue);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleImportLotes = () => {
    if (!inputValue.trim()) {
      toast.error("Por favor, insira os dados dos lotes");
      return;
    }

    try {
      const parsed = parseLotes(inputValue);

      if (parsed.length === 0) {
        toast.error(
          "Nenhum lote encontrado. Use o formato: 1 - CODIGO1 + CODIGO2"
        );
        return;
      }

      setLotes([...lotes, ...parsed]);
      setInputValue("");
      setSuggestions([]);
      setShowSuggestions(false);
      toast.success(`${parsed.length} lote(s) importado(s) com sucesso!`);
    } catch (error) {
      toast.error("Erro ao processar lotes");
      console.error(error);
    }
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    setLotes((prev) =>
      prev.map((lote) => (lote.id === id ? { ...lote, quantity } : lote))
    );
  };

  const handleDeleteLote = (id: string) => {
    setLotes((prev) => prev.filter((lote) => lote.id !== id));
    toast.success("Lote removido");
  };

  const handleClearAll = () => {
    if (confirm("Tem certeza que deseja limpar todos os lotes?")) {
      setLotes([]);
      setReportData([]);
      localStorage.removeItem(STORAGE_KEY);
      toast.success("Todos os lotes foram removidos");
    }
  };

  const handleGeneratePreview = async () => {
    if (lotes.length === 0) {
      toast.error("Adicione lotes antes de visualizar o relatório");
      return;
    }

    setLoading(true);
    try {
      const reports = await generateReport(lotes, multiplier);
      if (reports) {
        setReportData(reports);
        toast.success("Relatório gerado com sucesso!");
      } else {
        toast.error("Erro ao gerar relatório");
      }
    } catch (error) {
      toast.error("Erro ao gerar relatório");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (lotes.length === 0) {
      toast.error("Adicione lotes antes de gerar o relatório");
      return;
    }

    setLoading(true);
    try {
      await exportPDF(lotes, multiplier);
    } catch (error) {
      toast.error("Erro ao gerar relatório");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateExcel = async () => {
    if (lotes.length === 0) {
      toast.error("Adicione lotes antes de gerar a planilha");
      return;
    }

    setLoading(true);
    try {
      await exportExcel(lotes, multiplier);
    } catch (error) {
      toast.error("Erro ao gerar planilha");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAnvisa = async (code: string) => {
    try {
      const descriptorData = await getDescriptor(code);

      if (!descriptorData || !descriptorData.registration) {
        toast.error(`Registro ANVISA não encontrado para ${code}`);
        return;
      }

      await navigator.clipboard.writeText(descriptorData.registration);
      toast.success(`ANVISA ${descriptorData.registration} copiado!`);
    } catch (error) {
      console.error("Error fetching ANVISA registration:", error);
      toast.error("Erro ao buscar registro ANVISA");
    }
  };

  const handleCopyCatalogPath = async (code: string) => {
    try {
      const catalogUrl = getCatalogStorageUrl(code);

      // Verify if the file exists when using Supabase
      const fileResponse = await fetch(catalogUrl, { method: 'HEAD' });
      if (!fileResponse.ok) {
        toast.error("Catálogo não encontrado para este produto");
        return;
      }

      // Download the catalog logic: Use an anchor tag to trigger a browser direct download
      const link = document.createElement("a");
      link.href = catalogUrl;
      link.target = "_blank";
      link.download = `${code}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Abrindo catálogo!");
    } catch (error) {
      console.error("Error downloading catalog:", error);
      toast.error("Erro ao baixar catálogo");
    }
  };

  const handleCopyCatalogShareLink = (code: string) => {
    const shareUrl = getCatalogStorageUrl(code);
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link do catálogo copiado para compartilhar com cliente!");
  };

  const handleOpenImageViewer = (code: string) => {
    setSelectedProductCode(code);
    setImageViewerOpen(true);
  };

  const handleOpenCatalogViewer = (code: string) => {
    setSelectedProductCode(code);
    setCatalogViewerOpen(true);
  };

  const handleCopyImageLink = async (code: string) => {
    try {
      const product = products.find((p) => p.code === code);
      if (!product) {
        toast.error("Produto não encontrado");
        return;
      }

      // Dynamically find images for this product code
      const { findImagesFlexible } = await import("@/services/imageService");
      const images = await findImagesFlexible(code);

      if (!images || images.length === 0) {
        toast.error("Foto não configurada para este produto");
        return;
      }

      // Copy the first image URL
      const imageUrl = images[0];
      const fullUrl = imageUrl.startsWith('http')
        ? imageUrl
        : `${window.location.origin}${imageUrl}`;

      await navigator.clipboard.writeText(fullUrl);
      toast.success("Link da foto copiado para compartilhar!");
    } catch (error) {
      console.error("Error copying image link:", error);
      toast.error("Erro ao copiar link da foto");
    }
  };

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-4xl font-extrabold text-foreground">
            Gestão de Lotes
          </h1>
          <p className="text-muted-foreground mt-2">
            Crie e gerencie lotes de produtos para relatórios e catálogos
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Section */}
          <Card className="lg:col-span-2 p-6">
            <h2 className="text-lg font-600 mb-4">Importar Lotes</h2>

            <div className="space-y-4">
              <div className="relative">
                <Label htmlFor="lotes-input" className="font-500">
                  Dados dos Lotes
                </Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Use o formato: <code className="bg-muted px-2 py-1 rounded">1 - CODIGO1 + CODIGO2</code>
                </p>
                <Textarea
                  id="lotes-input"
                  value={inputValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onFocus={() => {
                    if (suggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  placeholder={`1 - 5L500 + 3L960
2 - AM1000
3 - CA20-006 + A34 + A33`}
                  className="font-mono text-sm h-48"
                />

                {/* Autocomplete Suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-950 border border-border rounded-md shadow-lg z-10">
                    <div className="p-2">
                      <p className="text-xs text-muted-foreground px-2 py-1 font-500">
                        Produtos Disponíveis
                      </p>
                      <div className="space-y-1">
                        {suggestions.map((product) => (
                          <button
                            key={product.code}
                            type="button"
                            onClick={() => handleSuggestionClick(product)}
                            className="w-full text-left px-3 py-2 rounded hover:bg-muted transition text-sm font-500 text-foreground"
                          >
                            <div className="flex flex-col">
                              <span className="font-600">{product.description}</span>
                              <span className="text-xs text-muted-foreground">{product.code}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Button
                onClick={handleImportLotes}
                size="lg"
                className="w-full gap-2"
              >
                <Plus className="w-4 h-4" />
                Importar Lotes
              </Button>

              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900 dark:text-blue-300">
                    <p className="font-500 mb-1">Dica de Formatação</p>
                    <p>
                      Cada linha deve conter um lote. Separe códigos com{" "}
                      <code className="bg-white dark:bg-black px-1 rounded">
                        +
                      </code>
                      . O número do lote deve ser único.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Summary Section */}
          <Card className="p-6">
            <h2 className="text-lg font-600 mb-4">Resumo</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">Total de Lotes</p>
                <p className="text-3xl font-700 text-primary">{lotes.length}</p>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">Total de Códigos</p>
                <p className="text-2xl font-700 text-secondary">
                  {lotes.reduce((sum, l) => sum + l.codes.length, 0)}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">Quantidade Total</p>
                <p className="text-2xl font-700 text-accent">
                  {lotes.reduce((sum, l) => sum + l.quantity, 0)}
                </p>
              </div>

              <div className="pt-4 space-y-3 border-t border-border">
                <div>
                  <Label htmlFor="multiplier" className="text-sm font-500 block mb-2">
                    Multiplicador de Preço
                  </Label>
                  <Input
                    id="multiplier"
                    type="number"
                    min="1"
                    max="100"
                    step="0.1"
                    value={multiplier}
                    onChange={(e) => setMultiplier(Math.max(1, parseFloat(e.target.value) || 1))}
                    className="w-full"
                    placeholder="Ex: 3"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Preço final será multiplicado por X{multiplier}
                  </p>
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <Button
                  onClick={handleLoadAllProducts}
                  disabled={products.length === 0}
                  className="w-full gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Zap className="w-4 h-4" />
                  Carregar Todos ({products.length})
                </Button>

                <Button
                  onClick={handleGeneratePreview}
                  disabled={lotes.length === 0 || loading}
                  className="w-full gap-2"
                  variant="default"
                >
                  <Eye className="w-4 h-4" />
                  {loading ? "Gerando..." : "Visualizar Relatório"}
                </Button>

                <Button
                  onClick={handleGenerateReport}
                  disabled={lotes.length === 0 || loading}
                  className="w-full gap-2"
                  variant="outline"
                >
                  <DownloadCloud className="w-4 h-4" />
                  {loading ? "Gerando..." : "Gerar PDF"}
                </Button>
                <Button
                  onClick={handleGenerateExcel}
                  disabled={lotes.length === 0 || loading}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <DownloadCloud className="w-4 h-4" />
                  {loading ? "Gerando..." : "Gerar Excel"}
                </Button>

                {lotes.length > 0 && (
                  <Button
                    onClick={handleClearAll}
                    variant="outline"
                    className="w-full gap-2 text-destructive hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                    Limpar Tudo
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Lotes List */}
        {lotes.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-600 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Lotes ({lotes.length})
            </h2>

            <div className="space-y-3">
              {lotes.map((lote) => (
                <div
                  key={lote.id}
                  className="p-4 bg-muted rounded-lg hover:bg-muted/80 transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-600 text-lg text-foreground">
                        {lote.number}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {lote.codes.length} código(s)
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {lote.codes.map((code, index) => (
                          <div
                            key={`${lote.id}-${index}`}
                            className="flex items-center gap-1 px-2 py-1 bg-primary/20 text-primary text-xs font-500 rounded"
                          >
                            <span>{code}</span>
                            <div className="flex gap-1 ml-1">
                              <Button
                                variant="ghost"
                                onClick={() => handleOpenImageViewer(code)}
                                className="h-5 w-5 p-0 hover:bg-primary/30"
                                title="Ver fotos"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                onClick={() => handleCopyImageLink(code)}
                                className="h-5 w-5 p-0 hover:bg-primary/30"
                                title="Copiar link da foto"
                              >
                                <Share2 className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                onClick={() => handleOpenCatalogViewer(code)}
                                className="h-5 w-5 p-0 hover:bg-primary/30"
                                title="Ver catálogo"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                onClick={() => handleCopyAnvisa(code)}
                                className="h-5 w-5 p-0 hover:bg-primary/30"
                                title="Copiar ANVISA"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                onClick={() => handleCopyCatalogPath(code)}
                                className="h-5 w-5 p-0 hover:bg-primary/30"
                                title="Copiar caminho do catálogo"
                              >
                                <FileText className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                onClick={() => handleCopyCatalogShareLink(code)}
                                className="h-5 w-5 p-0 hover:bg-primary/30"
                                title="Copiar link do catálogo"
                              >
                                <Share2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center gap-1">
                        <Label
                          htmlFor={`qty-${lote.id}`}
                          className="text-xs text-muted-foreground"
                        >
                          Qtd:
                        </Label>
                        <Input
                          id={`qty-${lote.id}`}
                          type="number"
                          min="1"
                          value={lote.quantity}
                          onChange={(e) =>
                            handleUpdateQuantity(
                              lote.id,
                              Math.max(1, parseInt(e.target.value) || 1)
                            )
                          }
                          className="w-16 text-center"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteLote(lote.id)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {lotes.length === 0 && (
          <Card className="p-12 text-center bg-muted/50">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">
              Nenhum lote importado ainda. Use o formulário ao lado para
              começar.
            </p>
          </Card>
        )}

        {/* Batch Report Preview */}
        {reportData.length > 0 && <BatchReport reports={reportData} />}

        {/* Compatibility Miniature */}
        <CompatibilityMini />
      </div>

      {/* Image Viewer Modal */}
      {selectedProductCode && (
        <ImageViewer
          productCode={selectedProductCode}
          open={imageViewerOpen}
          onOpenChange={setImageViewerOpen}
        />
      )}

      {/* Catalog Viewer Modal */}
      {selectedProductCode && (
        <CatalogViewer
          productCode={selectedProductCode}
          open={catalogViewerOpen}
          onOpenChange={setCatalogViewerOpen}
        />
      )}
    </Layout>
  );
}
