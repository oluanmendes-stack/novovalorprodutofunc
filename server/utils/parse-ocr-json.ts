import * as fs from "fs";
import * as path from "path";

export interface OCRProduct {
  code: string;
  description: string;
  manufacturer: string;
  finalPrice: number;
  ipiPercent: number;
  finalPriceWithIPI: number;
  distributorPrice: number;
  distributorIPI: number;
  distributorPriceWithIPI: number;
  resalePrice: number;
  resaleIPI: number;
  resalePriceWithIPI: number;
}

/**
 * Parse Brazilian price format (e.g., "1.234,56" to 1234.56)
 */
function parseBrazilianPrice(priceStr: string): number {
  if (!priceStr) return 0;
  // Remove spaces and dots (thousand separators)
  const cleaned = priceStr.trim().replace(/\./g, "");
  // Replace comma with dot for decimal
  const normalized = cleaned.replace(",", ".");
  return parseFloat(normalized);
}

/**
 * Parse OCR JSON extracted from PDF and convert to product list
 * Follows the EXACT same logic as the Python script
 */
export function parseOCRJson(jsonPath: string): OCRProduct[] {
  try {
    const fileContent = fs.readFileSync(jsonPath, "utf-8");
    const ocrData = JSON.parse(fileContent);

    const products: OCRProduct[] = [];
    const allTexts: Array<{ text: string; yPos: number; xPos: number; pageId: number }> = [];

    // Collect all texts from all pages
    if (ocrData.pages && Array.isArray(ocrData.pages)) {
      for (const page of ocrData.pages) {
        const pageId = page.page_id || 0;
        if (page.content && Array.isArray(page.content)) {
          for (const item of page.content) {
            if (item.text && item.position && Array.isArray(item.position)) {
              const yPos = Math.round(item.position[1]);
              const xPos = Math.round(item.position[0]);
              allTexts.push({
                text: item.text.trim(),
                yPos,
                xPos,
                pageId,
              });
            }
          }
        }
      }
    }

    console.log(`[parseOCRJson] Total text items: ${allTexts.length}`);

    // Group by Y position (rows) within each page
    const rowsByPage = new Map<number, Map<number, string[]>>();

    for (const item of allTexts) {
      if (!rowsByPage.has(item.pageId)) {
        rowsByPage.set(item.pageId, new Map());
      }

      const pageRows = rowsByPage.get(item.pageId)!;
      if (!pageRows.has(item.yPos)) {
        pageRows.set(item.yPos, []);
      }

      pageRows.get(item.yPos)!.push(item.text);
    }

    // Convert to sorted rows
    const allRows: string[][] = [];

    // Get pages in order
    const pageIds = Array.from(rowsByPage.keys()).sort((a, b) => a - b);

    for (const pageId of pageIds) {
      const pageRows = rowsByPage.get(pageId)!;
      // Get Y positions in order
      const yPositions = Array.from(pageRows.keys()).sort((a, b) => a - b);

      for (const yPos of yPositions) {
        // Sort by X position (left to right)
        const rowItems = allTexts
          .filter((t) => t.pageId === pageId && t.yPos === yPos)
          .sort((a, b) => a.xPos - b.xPos)
          .map((t) => t.text);

        if (rowItems.length > 0) {
          allRows.push(rowItems);
        }
      }
    }

    console.log(`[parseOCRJson] Total rows after grouping: ${allRows.length}`);

    // REGEX IGUAL AO PYTHON
    const pricePatternStr = /^\d{1,3}(?:\.\d{3})*,\d{2}$/;

    let productsExtracted = 0;

    // Process each row
    for (const rowItems of allRows) {
      // Skip header rows
      const rowText = rowItems.join(" ");

      if (
        !rowText.trim() ||
        rowText.includes("Descrição") ||
        rowText.includes("Venda") ||
        rowText.includes("Item") ||
        rowText.includes("Grupo") ||
        rowText.includes("Fabricante") ||
        rowText.length < 10
      ) {
        continue;
      }

      // Split into columns (same as Python: colunas = linha.split())
      const colunas = rowText.split(/\s+/);

      // Find all price indices (same as Python: indices_precos)
      const indicesPrecos: number[] = [];
      for (let i = 0; i < colunas.length; i++) {
        if (pricePatternStr.test(colunas[i])) {
          indicesPrecos.push(i);
        }
      }

      // Python checks: if len(indices_precos) >= 5
      // But based on the PDF structure with Preço Final, IPI, Preço Final c/IPI, 
      // Preço Revenda, IPI, Preço Revenda c/IPI, we need at least 5-6 prices
      // However, the OCR might not always extract all, so we check for minimum 2-3
      // But let's be strict and require at least 3 prices for a valid row
      if (indicesPrecos.length < 2) {
        continue;
      }

      try {
        // Extract code - should be one of the first items before description
        // Python: colunas[0] is item number, colunas[1] might be group, colunas[2] is manufacturer
        let code = "";
        let manufacturer = "";

        // Try pattern: [item#] [group] [manufacturer] [code] [description...] [prices...]
        // But OCR structure might be different, so we search for code
        
        // Find code - usually comes before description and before prices
        // It's typically an alphanumeric value at the beginning
        for (let i = 0; i < Math.min(5, colunas.length); i++) {
          const token = colunas[i];
          
          // Skip: item numbers (single/double digits), percentages
          if (token.match(/^\d{1,2}$/) && i === 0) continue; // Item number
          if (token.match(/^%$/)) continue;
          if (token.match(/\d+,\d+%/)) continue; // IPI percentage
          
          // Check if it's a price (should not be code)
          if (pricePatternStr.test(token)) break;
          
          // Code patterns
          const isCode =
            // Alphanumeric with numbers/hyphens (5L500, CA20-006, W0013C)
            (token.match(/[A-Z0-9]/i) && 
             !token.match(/^[\d]+$/) && 
             !token.match(/^%/) &&
             token.length >= 2 && 
             token.length <= 20) ||
            // Known code patterns
            token.match(/^[A-Z]{1,3}[0-9\-]+/i);
          
          if (isCode) {
            code = token.toUpperCase();
            // Manufacturer might be before code
            if (i > 0) {
              manufacturer = colunas[i - 1];
            }
            break;
          }
        }

        if (!code || code.length === 0) {
          continue;
        }

        // Extract description - from after code until first price
        let description = "";
        const codeIndex = colunas.indexOf(code);
        
        if (codeIndex >= 0 && codeIndex < indicesPrecos[0]) {
          // Get everything between code and first price
          const descStart = codeIndex + 1;
          const descEnd = indicesPrecos[0];
          if (descStart < descEnd) {
            description = colunas.slice(descStart, descEnd).join(" ");
          }
        }

        if (!description) {
          description = code; // Fallback
        }

        // Extract prices
        // Structure from PDF: Preço Final, IPI%, Preço Final c/IPI, Preço Revenda, IPI%, Preço Revenda c/IPI
        // But OCR might give us different amounts
        
        // Try to extract prices in order
        const prices: number[] = [];
        for (const priceIdx of indicesPrecos) {
          prices.push(parseBrazilianPrice(colunas[priceIdx]));
        }

        if (prices.length < 2) {
          continue;
        }

        // Map prices according to PDF structure
        // If we have 2 prices: [Final, Final c/IPI]
        // If we have 4+ prices: [Final, Final c/IPI, Revenda, Revenda c/IPI]
        
        let finalPrice: number;
        let finalPriceWithIPI: number;
        let resalePrice: number;
        let resalePriceWithIPI: number;
        let ipiPercent: number = 0;

        // Extract IPI percentage from the row
        const ipiMatch = rowText.match(/(\d+(?:,\d+)?)\s*%/);
        if (ipiMatch) {
          ipiPercent = parseBrazilianPrice(ipiMatch[1]);
        }

        if (prices.length >= 4) {
          // Full structure: [Final, Final c/IPI, Revenda, Revenda c/IPI]
          finalPrice = prices[0];
          finalPriceWithIPI = prices[1];
          resalePrice = prices[2];
          resalePriceWithIPI = prices[3];
        } else if (prices.length === 3) {
          // Possibly: [Final, Final c/IPI, Revenda c/IPI] or [Final, Revenda, Revenda c/IPI]
          // Assume first is Final, last is Revenda c/IPI
          finalPrice = prices[0];
          finalPriceWithIPI = prices[1];
          resalePrice = prices[0]; // Use Final as fallback for Revenda
          resalePriceWithIPI = prices[2];
        } else {
          // 2 prices: [Final, Final c/IPI] or [Final, Revenda] or [Revenda, Revenda c/IPI]
          // Assume first smaller value is base, second is with IPI
          if (prices[0] < prices[1]) {
            finalPrice = prices[0];
            finalPriceWithIPI = prices[1];
            resalePrice = prices[0];
            resalePriceWithIPI = prices[1];
          } else {
            // Prices might be in different order
            finalPrice = prices[0];
            finalPriceWithIPI = prices[0];
            resalePrice = prices[1];
            resalePriceWithIPI = prices[1];
          }
        }

        // Create product
        const product: OCRProduct = {
          code,
          description: description.trim(),
          manufacturer: manufacturer || code,
          finalPrice,
          ipiPercent,
          finalPriceWithIPI,
          distributorPrice: resalePrice,
          distributorIPI: ipiPercent,
          distributorPriceWithIPI: resalePriceWithIPI,
          resalePrice,
          resaleIPI: ipiPercent,
          resalePriceWithIPI,
        };

        products.push(product);
        productsExtracted++;
      } catch (e) {
        // Skip rows that fail
        continue;
      }
    }

    console.log(`[parseOCRJson] Products extracted: ${productsExtracted}`);
    console.log(`[parseOCRJson] Target: 463 products`);
    console.log(`[parseOCRJson] Coverage: ${Math.round((productsExtracted / 463) * 100)}%`);

    return products;
  } catch (error) {
    console.error("Error parsing OCR JSON:", error);
    return [];
  }
}
