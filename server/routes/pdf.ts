import { RequestHandler } from "express";
import { priceData } from "../index";

export interface PDFExtractionResponse {
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

/**
 * Extract and return PDF data
 * GET /api/pdf/extract
 */
export const extractPDFData: RequestHandler = (req, res) => {
  try {
    const startTime = Date.now();

    // Ensure we have products loaded
    if (!priceData || priceData.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Nenhum dado de produtos disponível. Verifique o PDF.",
        totalProducts: 0,
        targetProducts: 463,
        coverage: 0,
      });
    }

    // Transform price data to match the extraction response format
    const products = priceData.map((row: any) => ({
      code: row.code || "",
      description: row.description || "",
      manufacturer: row.manufacturer || "",
      resalePrice: row.resalePrice || row.distributorPrice || 0,
      resalePriceWithIPI: row.resalePriceWithIPI || row.distributorPriceWithIPI || 0,
      finalPrice: row.finalPrice || 0,
      finalPriceWithIPI: row.finalPriceWithIPI || 0,
    }));

    const totalProducts = products.length;
    const targetProducts = 463;
    const coverage = Math.round((totalProducts / targetProducts) * 100);
    const extractionTime = Date.now() - startTime;

    const response: PDFExtractionResponse = {
      totalProducts,
      targetProducts,
      coverage,
      products,
      stats: {
        linesWithPrices: totalProducts,
        linesWithEnoughPrices: totalProducts,
        extractionTime,
      },
    };

    res.json(response);
  } catch (error) {
    console.error("Error extracting PDF data:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao extrair dados do PDF",
      totalProducts: 0,
      targetProducts: 463,
      coverage: 0,
    });
  }
};
