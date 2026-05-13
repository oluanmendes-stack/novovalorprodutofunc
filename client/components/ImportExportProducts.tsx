import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Product {
  code: string;
  description: string;
  distributorPrice?: number;
  distributorPriceWithIPI?: number;
  finalPrice?: number;
  finalPriceWithIPI?: number;
  price?: number;
  priceWithIPI?: number;
}

interface ImportExportProductsProps {
  products: Product[];
  onImport?: () => void;
  onDelete?: () => void;
}

export default function ImportExportProducts({
  products,
  onImport,
  onDelete,
}: ImportExportProductsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportCSV = () => {
    if (products.length === 0) {
      toast.error("Nenhum produto disponível para exportar");
      return;
    }

    try {
      // Create CSV header
      const headers = [
        "Fabricante",
        "Descrição",
        "Preço Distribuidor s/ IPI",
        "Preço Distribuidor c/ IPI",
        "Preço Unit. Final s/ IPI",
        "Preço Final c/ IPI",
      ];
      const csvContent = [
        headers.join(";"),
        ...products.map((p) =>
          [
            p.code,
            p.description,
            (p.distributorPrice || 0).toString().replace(".", ","),
            (p.distributorPriceWithIPI || 0).toString().replace(".", ","),
            (p.finalPrice || 0).toString().replace(".", ","),
            (p.finalPriceWithIPI || 0).toString().replace(".", ","),
          ].join(";")
        ),
      ].join("\n");

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `produtos_${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`${products.length} produtos exportados com sucesso!`);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("Erro ao exportar produtos");
    }
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const text = await file.text();
      const lines = text.split("\n").filter((line) => line.trim());

      if (lines.length < 2) {
        toast.error("Arquivo CSV inválido. Mínimo de 1 produto necessário.");
        setIsLoading(false);
        return;
      }

      // Parse CSV - skip header and handle flexible column names
      const productsToImport: Product[] = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(";");
        if (parts.length >= 6) {
          const code = parts[0].trim();
          const description = parts[1].trim();
          const distributorPrice = parseFloat(parts[2].trim().replace(",", "."));
          const distributorPriceWithIPI = parseFloat(parts[3].trim().replace(",", "."));
          const finalPrice = parseFloat(parts[4].trim().replace(",", "."));
          const finalPriceWithIPI = parseFloat(parts[5].trim().replace(",", "."));

          if (
            code &&
            description &&
            !isNaN(distributorPrice) &&
            !isNaN(distributorPriceWithIPI) &&
            !isNaN(finalPrice) &&
            !isNaN(finalPriceWithIPI)
          ) {
            productsToImport.push({
              code,
              description,
              distributorPrice,
              distributorPriceWithIPI,
              finalPrice,
              finalPriceWithIPI,
            });
          }
        }
      }

      if (productsToImport.length === 0) {
        toast.error("Nenhum produto válido encontrado no arquivo");
        setIsLoading(false);
        return;
      }

      // Make API call to import products
      const response = await fetch("/api/products/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ products: productsToImport }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Erro ao importar produtos");
        console.error("Import error:", data);
        return;
      }

      toast.success(`${data.count || productsToImport.length} produto(s) importado(s) com sucesso!`);
      if (onImport) {
        onImport();
      }
    } catch (error) {
      console.error("Error importing CSV:", error);
      toast.error("Erro ao processar arquivo CSV");
    } finally {
      setIsLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteAll = async () => {
    if (products.length === 0) {
      toast.error("Nenhum produto para apagar");
      return;
    }

    const confirmed = window.confirm(
      `Tem certeza? Isto irá apagar todos os ${products.length} produtos. Esta ação não pode ser desfeita.`
    );

    if (!confirmed) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/products/delete-all", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Erro ao apagar produtos");
        return;
      }

      toast.success(`${data.deletedCount || 0} produto(s) apagado(s) com sucesso!`);
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error("Error deleting products:", error);
      toast.error("Erro ao apagar produtos");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-card border border-border">
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Gerenciar Produtos
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Total de produtos: <strong>{products.length}</strong>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Import Button */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              className="hidden"
              disabled={isLoading}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Importar CSV
            </Button>
          </div>

          {/* Export Button */}
          <Button
            onClick={handleExportCSV}
            disabled={isLoading || products.length === 0}
            variant="outline"
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>

          {/* Delete All Button */}
          <Button
            onClick={handleDeleteAll}
            disabled={isLoading || products.length === 0}
            variant="destructive"
            className="w-full"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Apagar Tudo
          </Button>
        </div>

        <div className="text-xs text-muted-foreground mt-2 p-3 bg-muted rounded-lg">
          <p className="font-semibold mb-2">Formato CSV esperado:</p>
          <p>Fabricante;Descrição;Preço Distribuidor s/ IPI;Preço Distribuidor c/ IPI;Preço Unit. Final s/ IPI;Preço Final c/ IPI</p>
          <p className="mt-2">Exemplo:</p>
          <p>5L500;BATERIA DE LITIO NAO RECARREGAVEL;2.288,58;2.511,72;2.542,87;2.790,80</p>
        </div>
      </div>
    </Card>
  );
}
