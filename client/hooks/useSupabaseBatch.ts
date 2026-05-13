import { useState } from "react";
import { toast } from "sonner";
import { generateBatchReport, BatchItem } from "@/lib/supabase";

export interface Lote {
  id: string;
  number: string;
  codes: string[];
  quantity: number;
  totalPrice: number;
}

export interface BatchReport {
  lote: string;
  codes: string[];
  quantity: number;
  products: Array<{
    code: string;
    description: string;
    descriptor: string | null;
    marca: string;
    price: number;
    priceWithIPI: number;
    totalPrice: number;
    totalPriceWithIPI: number;
  }>;
  batchTotalPrice: number;
  batchTotalPriceWithIPI: number;
}

export function useSupabaseBatch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = async (lotes: Lote[], multiplier: number = 3): Promise<BatchReport[] | null> => {
    try {
      setLoading(true);
      setError(null);

      const batchData: BatchItem[] = lotes.map((lote) => ({
        loteNumber: lote.number,
        codes: lote.codes,
        quantity: lote.quantity,
      }));

      const result = await generateBatchReport(batchData, multiplier);

      if (result && result.success) {
        if (result.notFoundCodes && result.notFoundCodes.length > 0) {
          toast.warning(
            `${result.notFoundCodes.length} código(s) não encontrado(s)`
          );
        }
        return result.reports || [];
      } else {
        throw new Error(result?.error || "Falha ao gerar relatório");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      toast.error("Erro ao gerar relatório: " + message);
      console.error("Error generating report:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async (lotes: Lote[], multiplier: number = 3): Promise<void> => {
    toast.info("Exportação de PDF não disponível na versão em produção");
  };

  const exportExcel = async (lotes: Lote[], multiplier: number = 3): Promise<void> => {
    toast.info("Exportação de Excel não disponível na versão em produção");
  };

  return {
    loading,
    error,
    generateReport,
    exportPDF,
    exportExcel,
  };
}
