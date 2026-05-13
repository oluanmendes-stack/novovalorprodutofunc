import { useState } from "react";
import { toast } from "sonner";

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
    price: number;
    priceWithIPI: number;
    totalPrice: number;
    totalPriceWithIPI: number;
  }>;
  batchTotalPrice: number;
  batchTotalPriceWithIPI: number;
}

export function useBatch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = async (lotes: Lote[]) => {
    // Batch report API is not available in the deployed version
    // Use useSupabaseBatch instead for client-side generation
    toast.info("Use o hook useSupabaseBatch para gerar relatórios");
    return null;
  };

  const exportPDF = async (lotes: Lote[]) => {
    toast.info("Exportação de PDF não disponível na versão em produção");
    return null;
  };

  const exportExcel = async (lotes: Lote[]) => {
    toast.info("Exportação de Excel não disponível na versão em produção");
    return null;
  };

  return {
    loading,
    error,
    generateReport,
    exportPDF,
    exportExcel,
  };
}
