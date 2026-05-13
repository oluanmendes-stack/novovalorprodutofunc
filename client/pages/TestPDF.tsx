import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  FileText,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";

export interface PDFExtractionResult {
  totalProducts: number;
  targetProducts: number;
  coverage: number;
  products: Array<{
    code: string;
    description: string;
    manufacturer: string;
    resalePrice: number;
    resalePriceWithIPI: number;
    finalPrice: number;
    finalPriceWithIPI: number;
  }>;
  stats: {
    linesWithPrices: number;
    linesWithEnoughPrices: number;
    extractionTime: number;
  };
}

export default function TestPDF() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PDFExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(20);

  const extractPDF = async () => {
    setLoading(true);
    setError(null);

    try {
      // PDF extraction API is not available in the deployed version
      const message = "Extração de PDF requer acesso ao servidor backend. Este recurso não está disponível na versão em produção.";
      setError(message);
      toast.info(message);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!result) return;

    const headers = [
      "Código",
      "Descrição",
      "Fabricante",
      "Preço Revenda",
      "Preço Revenda c/ IPI",
      "Preço Final",
      "Preço Final c/ IPI",
    ];

    const rows = result.products.map((p) => [
      p.code,
      p.description,
      p.manufacturer,
      p.resalePrice.toFixed(2),
      p.resalePriceWithIPI.toFixed(2),
      p.finalPrice.toFixed(2),
      p.finalPriceWithIPI.toFixed(2),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${cell}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pdf_extraction_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast.success("CSV exportado com sucesso!");
  };

  useEffect(() => {
    extractPDF();
  }, []);

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-4xl font-extrabold text-foreground">
            Teste de Extração PDF
          </h1>
          <p className="text-muted-foreground mt-2">
            Validar extração de dados da "Tabela de Preços.pdf"
          </p>
        </div>

        {/* Status Card */}
        {result && (
          <Card className="p-6 border-2 border-primary/50">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-700 text-foreground mb-2">
                  Resultado da Extração
                </h2>
                <p className="text-muted-foreground">
                  Dados extraídos do PDF na pasta raiz
                </p>
              </div>
              <div className={`p-4 rounded-lg ${
                result.totalProducts >= 450
                  ? "bg-green-100 dark:bg-green-950"
                  : result.totalProducts >= 400
                  ? "bg-yellow-100 dark:bg-yellow-950"
                  : "bg-red-100 dark:bg-red-950"
              }`}>
                {result.totalProducts >= 450 ? (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-yellow-600" />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Produtos Extraídos
                </p>
                <p className="text-4xl font-700 text-primary">
                  {result.totalProducts}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Meta (Alvo)
                </p>
                <p className="text-4xl font-700 text-foreground">
                  {result.targetProducts}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Cobertura
                </p>
                <p className="text-4xl font-700 text-secondary">
                  {result.coverage}%
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Tempo (ms)
                </p>
                <p className="text-4xl font-700 text-accent">
                  {result.stats.extractionTime}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="font-600 mb-3">Estatísticas Detalhadas</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">
                    Linhas com Preços
                  </p>
                  <p className="text-2xl font-700">
                    {result.stats.linesWithPrices}
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">
                    Linhas com 5+ Preços
                  </p>
                  <p className="text-2xl font-700">
                    {result.stats.linesWithEnoughPrices}
                  </p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">
                    Taxa de Sucesso
                  </p>
                  <p className="text-2xl font-700">
                    {(
                      (result.totalProducts /
                        result.stats.linesWithEnoughPrices) *
                      100
                    ).toFixed(1)}
                    %
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {error && (
          <Card className="p-6 border-2 border-red-500 bg-red-50 dark:bg-red-950">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-600 text-red-900 dark:text-red-100 mb-1">
                  Erro na Extração
                </h3>
                <p className="text-red-800 dark:text-red-200">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={extractPDF}
            disabled={loading}
            size="lg"
            className="gap-2"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Processando..." : "Reprocessar PDF"}
          </Button>

          {result && (
            <>
              <Button
                onClick={exportToCSV}
                variant="outline"
                size="lg"
                className="gap-2"
              >
                <Download className="w-5 h-5" />
                Exportar CSV
              </Button>
              <Button
                onClick={() =>
                  setDisplayCount((c) =>
                    c === 20 ? result.products.length : 20
                  )
                }
                variant="outline"
                size="lg"
                className="gap-2"
              >
                <BarChart3 className="w-5 h-5" />
                {displayCount === 20 ? "Ver Todos" : "Ver Top 20"}
              </Button>
            </>
          )}
        </div>

        {/* Products Table */}
        {result && result.products.length > 0 && (
          <Card className="p-6 overflow-x-auto">
            <h2 className="text-lg font-600 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Produtos ({result.products.length})
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="text-left py-3 px-4 font-600">Código</th>
                    <th className="text-left py-3 px-4 font-600">Descrição</th>
                    <th className="text-left py-3 px-4 font-600">Fabricante</th>
                    <th className="text-right py-3 px-4 font-600">
                      Preço Revenda
                    </th>
                    <th className="text-right py-3 px-4 font-600">
                      Revenda c/ IPI
                    </th>
                    <th className="text-right py-3 px-4 font-600">
                      Preço Final
                    </th>
                    <th className="text-right py-3 px-4 font-600">
                      Final c/ IPI
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.products.slice(0, displayCount).map((product, idx) => (
                    <tr
                      key={`${product.code}-${idx}`}
                      className="border-b border-border hover:bg-muted/50 transition"
                    >
                      <td className="py-3 px-4 font-600 text-primary">
                        {product.code}
                      </td>
                      <td className="py-3 px-4 text-foreground">
                        {product.description}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {product.manufacturer}
                      </td>
                      <td className="py-3 px-4 text-right">
                        R$ {product.resalePrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-600 text-secondary">
                        R$ {product.resalePriceWithIPI.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        R$ {product.finalPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-600 text-secondary">
                        R$ {product.finalPriceWithIPI.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {displayCount === 20 && result.products.length > 20 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Mostrando {displayCount} de {result.products.length} produtos
                </p>
              </div>
            )}
          </Card>
        )}

        {/* Empty State */}
        {!loading && !result && !error && (
          <Card className="p-12 text-center bg-muted/50">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">
              Clique em "Reprocessar PDF" para iniciar a extração
            </p>
          </Card>
        )}
      </div>
    </Layout>
  );
}
