import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";
import PDFDocument from "pdfkit";
import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";

// Cloudflare-safe directory resolution
const getPublicDir = () => path.resolve(process.cwd(), "public");
const getDataDir = () => path.resolve(process.cwd(), "server/data");
const getDescriptorDir = () => path.resolve(getPublicDir(), "catalogo/descritivos");

// Global price data storage (populated by price parser or mock)
let priceData: any[] = [];

export function setPriceData(data: any[]) {
  priceData = data;
}

function generateMockPriceData() {
  return [];
}

const getSupabase = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;
  return url && key ? createClient(url, key) : null;
};

/**
 * Normalize product code for consistent matching
 * Removes extra spaces, converts to lowercase, removes invisible characters
 */
function normalizeCode(code: string): string {
  return code
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
    .replace(/[\u200B-\u200D\uFEFF]/g, '');  // Remove zero-width characters
}

export interface BatchItem {
  loteNumber: string;
  codes: string[];
  quantity: number;
  multiplier?: number;
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
    priceMultiplied?: number;
  }>;
  batchTotalPrice: number;
  batchTotalPriceWithIPI: number;
}

/**
 * Read product descriptor from public/catalogo/descritivos folder
 * Tries multiple variations of the filename to handle common naming inconsistencies
 * Also handles files with multiple codes concatenated (e.g., CODE1.CODE2.txt)
 */
function getProductDescriptor(productCode: string): string | null {
  try {
    const descriptorDir = getDescriptorDir();
    
    // Check if directory exists (fs might throw on some serverless platforms)
    try {
      if (!fs.existsSync(descriptorDir)) return null;
    } catch {
      return null;
    }

    console.log(`[getProductDescriptor] Searching for "${productCode}" in ${descriptorDir}`);

    // Try common file extensions
    const extensions = [".txt", ".md", ""];

    // Try exact match first
    for (const ext of extensions) {
      const filePath = path.join(descriptorDir, `${productCode}${ext}`);
      if (fs.existsSync(filePath)) {
        console.log(`[getProductDescriptor] Found exact match: ${filePath}`);
        const content = fs.readFileSync(filePath, "utf-8");
        return content.trim();
      }
    }

    // Try variations: with underscores, spaces, etc.
    // List all files in directory and try fuzzy matching
    try {
      const files = fs.readdirSync(descriptorDir);
      const normalizedCode = productCode.toLowerCase().trim();
      console.log(`[getProductDescriptor] Looking through ${files.length} files in directory`);

      for (const file of files) {
        const normalizedFile = file.toLowerCase();
        const fileWithoutExt = normalizedFile.replace(/\.(txt|md)$/, '');

        // Exact match
        if (fileWithoutExt === normalizedCode) {
          console.log(`[getProductDescriptor] Found exact match with file: ${file}`);
          const filePath = path.join(descriptorDir, file);
          const content = fs.readFileSync(filePath, "utf-8");
          return content.trim();
        }

        // Starts with code (handles _1, _2, etc.)
        if (fileWithoutExt.startsWith(normalizedCode + '_') ||
            fileWithoutExt.startsWith(normalizedCode + ' ')) {
          console.log(`[getProductDescriptor] Found prefix match with file: ${file}`);
          const filePath = path.join(descriptorDir, file);
          const content = fs.readFileSync(filePath, "utf-8");
          return content.trim();
        }

        // Check if code appears in filename separated by dot or other separators
        // Handles cases like "CODE1.CODE2.txt" or "CODE1-CODE2.txt"
        const codeVariations = fileWithoutExt.split(/[\.\-_]+/);
        if (codeVariations.some(part => part === normalizedCode)) {
          console.log(`[getProductDescriptor] Found "${productCode}" in multi-code file: ${file}`);
          const filePath = path.join(descriptorDir, file);
          const content = fs.readFileSync(filePath, "utf-8");
          return content.trim();
        }

        // Also try substring match as fallback
        if (fileWithoutExt.includes(normalizedCode) && normalizedCode.length > 3) {
          console.log(`[getProductDescriptor] Found "${productCode}" as substring in: ${file}`);
          const filePath = path.join(descriptorDir, file);
          const content = fs.readFileSync(filePath, "utf-8");
          return content.trim();
        }
      }

      console.log(`[getProductDescriptor] No file found for "${productCode}"`);
    } catch (dirError) {
      console.error(`[getProductDescriptor] Error reading directory:`, dirError);
      // Directory reading error, continue with null
    }

    return null;
  } catch (error) {
    console.error(`Error reading descriptor for ${productCode}:`, error);
    return null;
  }
}

/**
 * Generate batch report (combines batch data with product prices)
 */
export const generateBatchReport: RequestHandler = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { batches, multiplier } = req.body;
    const finalMultiplier = typeof multiplier === 'number' ? multiplier : 3;

    if (!Array.isArray(batches) || batches.length === 0) {
      res.status(400).json({
        success: false,
        error: "Batches array required",
      });
      return;
    }

    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: "Supabase not configured",
      });
    }

    // Fetch all products from Supabase
    const { data: productData, error: dbError } = await supabase
      .from("products")
      .select("*");

    if (dbError || !productData) {
      console.error("Error fetching products from Supabase:", dbError);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch products from database",
      });
    }

    console.log(`[generateBatchReport] Using ${productData.length} products from Supabase`);

    const reports: BatchReport[] = [];
    let foundCount = 0;
    let notFoundCodes: string[] = [];

    for (const batch of batches as BatchItem[]) {
      const batchProducts = [];
      let batchTotalPrice = 0;
      let batchTotalPriceWithIPI = 0;

      for (const code of batch.codes) {
        const normalizedCode = normalizeCode(code);
        const product = productData.find(
          (p) => normalizeCode(p.code) === normalizedCode
        );

        if (product) {
          foundCount++;
          // Try multiple field names for price (handle different Supabase schema variations)
          const unitPrice = typeof product.resalePrice === 'number' ? product.resalePrice :
                           typeof product.priceResale === 'number' ? product.priceResale :
                           typeof product.price === 'number' ? product.price : 0;
          const unitPriceWithIPI = typeof product.resalePriceWithIPI === 'number' ? product.resalePriceWithIPI :
                                  typeof product.priceResaleWithIPI === 'number' ? product.priceResaleWithIPI :
                                  typeof product.priceWithIPI === 'number' ? product.priceWithIPI : 0;
          const totalPrice = unitPrice * batch.quantity;
          const totalPriceWithIPI = unitPriceWithIPI * batch.quantity;
          const priceMultiplied = unitPriceWithIPI * finalMultiplier;
          const descriptor = getProductDescriptor(product.code);

          console.log(`[generateBatchReport] Product ${product.code}: price=${unitPrice}, priceWithIPI=${unitPriceWithIPI}, multiplied=${priceMultiplied}`);

          batchProducts.push({
            code: product.code,
            description: product.description,
            descriptor,
            price: unitPrice,
            priceWithIPI: unitPriceWithIPI,
            totalPrice,
            totalPriceWithIPI,
            priceMultiplied,
          });

          batchTotalPrice += totalPrice;
          batchTotalPriceWithIPI += totalPriceWithIPI;
        } else {
          notFoundCodes.push(code);
        }
      }

      reports.push({
        lote: batch.loteNumber,
        codes: batch.codes,
        quantity: batch.quantity,
        products: batchProducts,
        batchTotalPrice,
        batchTotalPriceWithIPI,
      });
    }

    console.log(`[generateBatchReport] Found ${foundCount} products, ${notFoundCodes.length} not found`);
    if (notFoundCodes.length > 0 && notFoundCodes.length <= 10) {
      console.log(`[generateBatchReport] Not found codes: ${notFoundCodes.join(', ')}`);
    }

    res.json({
      success: true,
      data: reports,
      count: reports.length,
    });
  } catch (error) {
    console.error("Error generating batch report:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate batch report",
    });
  }
};

/**
 * Export batch as PDF
 */
export const exportBatchPDF: RequestHandler = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { batches, multiplier } = req.body;
    const finalMultiplier = typeof multiplier === 'number' ? multiplier : 3;

    if (!Array.isArray(batches) || batches.length === 0) {
      console.error("[exportBatchPDF] No batches provided");
      res.status(400).json({
        success: false,
        error: "Batches array required",
      });
      return;
    }

    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: "Supabase not configured",
      });
    }

    // Fetch all products from Supabase
    const { data: productData, error: dbError } = await supabase
      .from("products")
      .select("*");

    if (dbError || !productData) {
      console.error("Error fetching products from Supabase:", dbError);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch products from database",
      });
    }

    if (!productData || productData.length === 0) {
      console.error("[exportBatchPDF] No product data available!");
      return res.status(500).json({
        success: false,
        error: "Nenhum produto disponível no banco de dados",
      });
    }

    console.log(`[exportBatchPDF] Starting PDF export with ${batches.length} batch(es), ${productData.length} products available`);

    const doc = new PDFDocument({ margin: 50 });
    const filename = `batch_report_${Date.now()}.pdf`;
    const chunks: Buffer[] = [];

    // Collect PDF chunks into buffer instead of piping directly
    doc.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    // Handle doc errors
    doc.on("error", (err: any) => {
      console.error("[exportBatchPDF] PDF document error:", err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: "Erro ao gerar PDF: " + err.message,
        });
      }
    });

    // Send response after PDF is finalized
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", pdfBuffer.length);
      res.send(pdfBuffer);
    });

    let totalFoundCount = 0;
    let totalNotFoundCount = 0;

    // Helper function to draw a table row with proper text wrapping
    const drawTableRow = (label: string, value: string) => {
      const pageWidth = doc.page.width;
      const margins = 50;
      const usableWidth = pageWidth - margins * 2;
      const leftColumnWidth = usableWidth * 0.35;
      const rightColumnWidth = usableWidth * 0.65;

      const startX = margins;
      const startY = doc.y;
      const padding = 5;

      // Calculate text height for value
      doc.fontSize(9).font("Helvetica");
      const valueHeight = doc.heightOfString(value, {
        width: rightColumnWidth - padding * 2,
      });

      // Row height should accommodate the taller of label or value
      const minRowHeight = 25;
      const rowHeight = Math.max(minRowHeight, Math.ceil(valueHeight) + padding * 2);

      // Check if we need a new page
      if (startY + rowHeight > doc.page.height - 50) {
        doc.addPage();
      }

      // Draw borders
      doc.strokeColor("#999").lineWidth(0.5);
      doc.rect(startX, doc.y, leftColumnWidth, rowHeight).stroke();
      doc.rect(startX + leftColumnWidth, doc.y, rightColumnWidth, rowHeight).stroke();

      // Draw label (left column)
      doc.fontSize(10).font("Helvetica-Bold").fillColor("#000");
      const labelOptions = {
        width: leftColumnWidth - padding * 2,
        align: "left" as const,
        height: rowHeight - padding * 2,
      };
      doc.text(label, startX + padding, doc.y + padding, labelOptions);

      // Draw value (right column)
      doc.fontSize(9).font("Helvetica").fillColor("#000");
      const valueOptions = {
        width: rightColumnWidth - padding * 2,
        align: "left" as const,
        height: rowHeight - padding * 2,
      };
      doc.text(value, startX + leftColumnWidth + padding, startY + padding, valueOptions);

      // Move to next row
      doc.y = startY + rowHeight;
    };

    // Process each batch
    for (const batch of batches as BatchItem[]) {
      console.log(`[exportBatchPDF] Processing batch "${batch.loteNumber}" with ${batch.codes.length} codes`);

      let batchFoundCount = 0;

      // Add product tables
      for (const code of batch.codes) {
        const normalizedCode = normalizeCode(code);
        const product = productData.find(
          (p) => normalizeCode(p.code) === normalizedCode
        );

        if (product) {
          batchFoundCount++;
          // Try multiple field names for price (handle different Supabase schema variations)
          const unitPrice = typeof product.resalePrice === 'number' ? product.resalePrice :
                           typeof product.priceResale === 'number' ? product.priceResale :
                           typeof product.price === 'number' ? product.price : 0;
          const unitPriceWithIPI = typeof product.resalePriceWithIPI === 'number' ? product.resalePriceWithIPI :
                                  typeof product.priceResaleWithIPI === 'number' ? product.priceResaleWithIPI :
                                  typeof product.priceWithIPI === 'number' ? product.priceWithIPI : 0;
          const totalPrice = unitPrice * batch.quantity;
          const totalPriceWithIPI = unitPriceWithIPI * batch.quantity;
          const priceMultiplied = unitPriceWithIPI * finalMultiplier;

          // Get descriptor
          const descriptor = getProductDescriptor(product.code);

          // Product name
          drawTableRow("Nome:", product.description);

          // Lote and quantity
          drawTableRow("Lote / Qtd:", `${batch.loteNumber} / ${batch.quantity} unid.`);

          // Unit price distribuidor
          drawTableRow("Preço Unit. Distribuidor c/ IPI:", `R$ ${unitPrice.toFixed(2)}`);

          // Total price distribuidor
          drawTableRow("VALOR TOTAL LOTE (Distribuidor):", `R$ ${totalPrice.toFixed(2)}`);

          // Unit price final
          drawTableRow("Preço Unit. Final c/ IPI:", `R$ ${unitPriceWithIPI.toFixed(2)}`);

          // Total price final
          drawTableRow("VALOR TOTAL LOTE (Final):", `R$ ${totalPriceWithIPI.toFixed(2)}`);

          // Price Multiplied
          drawTableRow(`Preço Final c/ IPI X${finalMultiplier} (Unitário):`, `R$ ${priceMultiplied.toFixed(2)}`);

          // Descriptor - keep full text, let drawTableRow handle wrapping
          if (descriptor) {
            drawTableRow("Descritivo:", descriptor);
          }

          // Add spacing between products
          doc.moveDown(0.5);
        } else {
          totalNotFoundCount++;
        }
      }

      totalFoundCount += batchFoundCount;
      console.log(`[exportBatchPDF] Batch "${batch.loteNumber}" found ${batchFoundCount}/${batch.codes.length} products`);
    }

    // Finalize PDF
    console.log(`[exportBatchPDF] PDF generation completed: found ${totalFoundCount}, not found ${totalNotFoundCount}`);
    doc.end();
  } catch (error) {
    console.error("Error exporting PDF:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[exportBatchPDF] Full error details:", {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : "No stack trace",
    });

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: "Failed to export PDF: " + errorMessage,
      });
    }
  }
};

/**
 * Export batch as Excel
 */
export const exportBatchExcel: RequestHandler = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { batches, multiplier } = req.body;
    const finalMultiplier = typeof multiplier === 'number' ? multiplier : 3;

    if (!Array.isArray(batches) || batches.length === 0) {
      console.error("[exportBatchExcel] No batches provided");
      res.status(400).json({
        success: false,
        error: "Batches array required",
      });
      return;
    }

    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: "Supabase not configured",
      });
    }

    // Fetch all products from Supabase
    const { data: productData, error: dbError } = await supabase
      .from("products")
      .select("*");

    if (dbError || !productData) {
      console.error("Error fetching products from Supabase:", dbError);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch products from database",
      });
    }

    console.log(`[exportBatchExcel] Starting Excel export with ${batches.length} batch(es), ${productData.length} products available`);

    const workbook = XLSX.utils.book_new();
    const worksheetData: any[] = [];

    // Add title
    worksheetData.push([`Relatório de Lotes - ${new Date().toLocaleDateString("pt-BR")}`]);
    worksheetData.push([]);

    // Process each batch
    let totalFoundCount = 0;
    let totalNotFoundCount = 0;

    for (const batch of batches as BatchItem[]) {
      console.log(`[exportBatchExcel] Processing batch "${batch.loteNumber}" with ${batch.codes.length} codes`);
      worksheetData.push([`Lote: ${batch.loteNumber}`, `Quantidade: ${batch.quantity}`]);
      worksheetData.push(["Código", "Descrição", "Descritivo", "Preço Unit. Distribuidor c/ IPI", "Preço Unit. Final c/ IPI", "Total", "Total + IPI", `Preço X${finalMultiplier}`]);

      let batchTotalPrice = 0;
      let batchTotalPriceWithIPI = 0;
      let batchFoundCount = 0;

      for (const code of batch.codes) {
        const normalizedCode = normalizeCode(code);
        const product = productData.find(
          (p) => normalizeCode(p.code) === normalizedCode
        );

        if (product) {
          batchFoundCount++;
          // Try multiple field names for price (handle different Supabase schema variations)
          const unitPrice = typeof product.resalePrice === 'number' ? product.resalePrice :
                           typeof product.priceResale === 'number' ? product.priceResale :
                           typeof product.price === 'number' ? product.price : 0;
          const unitPriceWithIPI = typeof product.resalePriceWithIPI === 'number' ? product.resalePriceWithIPI :
                                  typeof product.priceResaleWithIPI === 'number' ? product.priceResaleWithIPI :
                                  typeof product.priceWithIPI === 'number' ? product.priceWithIPI : 0;
          const totalPrice = unitPrice * batch.quantity;
          const totalPriceWithIPI = unitPriceWithIPI * batch.quantity;
          const priceMultiplied = unitPriceWithIPI * finalMultiplier;

          // Get descriptor if available
          const descriptor = getProductDescriptor(product.code) || "";

          worksheetData.push([
            product.code,
            product.description,
            descriptor,
            unitPrice,
            unitPriceWithIPI,
            totalPrice,
            totalPriceWithIPI,
            priceMultiplied,
          ]);

          batchTotalPrice += totalPrice;
          batchTotalPriceWithIPI += totalPriceWithIPI;
        } else {
          totalNotFoundCount++;
        }
      }

      totalFoundCount += batchFoundCount;
      console.log(`[exportBatchExcel] Batch "${batch.loteNumber}" found ${batchFoundCount}/${batch.codes.length} products`);

      worksheetData.push(["", "", "", "", "", `Preço Total Distribuidor c/ IPI: R$ ${batchTotalPrice.toFixed(2)}`, `Preço Total Final c/ IPI: R$ ${batchTotalPriceWithIPI.toFixed(2)}`]);
      worksheetData.push([]);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    worksheet["!cols"] = [
      { wch: 15 },
      { wch: 50 },
      { wch: 80 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
    ];

    // Set row heights for better readability
    for (let i = 0; i < worksheetData.length; i++) {
      if (!worksheet["!rows"]) worksheet["!rows"] = [];
      worksheet["!rows"][i] = { hpt: 25 };
    }

    // Enable text wrapping for all cells
    for (const cell in worksheet) {
      if (cell.startsWith("!")) continue;
      if (!worksheet[cell].s) worksheet[cell].s = {};
      worksheet[cell].s.alignment = { wrapText: true, vertical: "top" };
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, "Lotes");

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

    console.log(`[exportBatchExcel] Excel generation completed: found ${totalFoundCount}, not found ${totalNotFoundCount}`);

    const filename = `batch_report_${Date.now()}.xlsx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(excelBuffer);
  } catch (error) {
    console.error("Error exporting Excel:", error);
    res.status(500).json({
      success: false,
      error: "Failed to export Excel",
    });
  }
};
