import * as fs from "fs";
import * as path from "path";

function parseBrazilianPrice(priceStr: string): number {
  if (!priceStr) return 0;
  const cleaned = priceStr.trim().replace(/\./g, "");
  const normalized = cleaned.replace(",", ".");
  return parseFloat(normalized);
}

async function analyzeOCRComplete() {
  try {
    const jsonPath = path.resolve("./Tabela de Preços.json");
    const fileContent = fs.readFileSync(jsonPath, "utf-8");
    const ocrData = JSON.parse(fileContent);

    const allTexts: Array<{text: string, yPos: number, xPos: number, pageId: number}> = [];
    
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

    const allRows: string[][] = [];
    const pageIds = Array.from(rowsByPage.keys()).sort((a, b) => a - b);
    
    for (const pageId of pageIds) {
      const pageRows = rowsByPage.get(pageId)!;
      const yPositions = Array.from(pageRows.keys()).sort((a, b) => a - b);
      
      for (const yPos of yPositions) {
        const rowItems = allTexts
          .filter(t => t.pageId === pageId && t.yPos === yPos)
          .sort((a, b) => a.xPos - b.xPos)
          .map(t => t.text);
        
        if (rowItems.length > 0) {
          allRows.push(rowItems);
        }
      }
    }

    const knownManufacturers = ["Bateria", "Conector", "Co2", "Gabmed", "Contec", "Med-Link", "Medtronic"];

    console.log(`Total rows: ${allRows.length}\n`);
    
    // Analyze all rows
    const analysis: {[key: string]: {count: number, samples: string[]}} = {
      "headers": { count: 0, samples: [] },
      "discount_rows": { count: 0, samples: [] },
      "products": { count: 0, samples: [] },
      "short_desc": { count: 0, samples: [] },
      "no_prices": { count: 0, samples: [] },
      "no_code": { count: 0, samples: [] },
      "other": { count: 0, samples: [] },
    };

    let headerSkipped = false;

    for (let rowIdx = 0; rowIdx < allRows.length; rowIdx++) {
      const row = allRows[rowIdx];
      const rowText = row.join(" ");
      
      // Headers
      if (!headerSkipped && (
        rowText.includes("Item") ||
        rowText.includes("Descrição") ||
        rowText.includes("Distribuidor") ||
        rowText.includes("Revenda") ||
        rowText.length < 20
      )) {
        analysis.headers.count++;
        if (analysis.headers.samples.length < 3) {
          analysis.headers.samples.push(`Row ${rowIdx}: "${rowText.substring(0, 60)}"`);
        }
        continue;
      }
      
      headerSkipped = true;
      
      if (row.length === 0 || rowText.trim() === "") {
        analysis.other.count++;
        continue;
      }

      // Check price count
      const priceMatches = rowText.match(/\d{1,3}(?:\.\d{3})*,\d{2}/g) || [];
      
      if (priceMatches.length === 0) {
        analysis.no_prices.count++;
        if (analysis.no_prices.samples.length < 5) {
          analysis.no_prices.samples.push(`Row ${rowIdx}: "${rowText.substring(0, 60)}"`);
        }
        continue;
      }
      
      if (priceMatches.length < 3) {
        analysis.discount_rows.count++;
        if (analysis.discount_rows.samples.length < 3) {
          analysis.discount_rows.samples.push(`Row ${rowIdx} (${priceMatches.length} prices): "${rowText.substring(0, 60)}"`);
        }
        continue;
      }

      // Check for code
      const tokens = rowText.trim().split(/\s+/);
      
      if (tokens.length < 6) {
        analysis.other.count++;
        continue;
      }

      let code = "";
      let manufacturer = tokens[1] && knownManufacturers.some(m => tokens[1].toLowerCase().includes(m.toLowerCase())) ? tokens[1] : "";
      
      if (manufacturer) {
        if (tokens.length > 2 && tokens[2].match(/^[A-Z0-9]/) && !tokens[2].match(/^\d+%?$/)) {
          code = tokens[2].toUpperCase();
        }
      } else {
        for (let i = 1; i < Math.min(5, tokens.length); i++) {
          const token = tokens[i];
          if (token.match(/^\d+%?$/)) continue;
          if ((token.match(/[A-Z]/i) && token.match(/[0-9\-\.]/)) && 
              token.length > 2 && token.length < 25 &&
              !token.match(/^\d{1,3}(?:\.\d{3})*,\d{2}/)) {
            code = token.toUpperCase();
            break;
          }
        }
      }

      if (!code) {
        analysis.no_code.count++;
        if (analysis.no_code.samples.length < 3) {
          analysis.no_code.samples.push(`Row ${rowIdx}: "${rowText.substring(0, 60)}"`);
        }
        continue;
      }

      // Extract description
      let description = "";
      const firstPriceMatch = rowText.match(/\d{1,3}(?:\.\d{3})*,\d{2}/);
      if (firstPriceMatch) {
        const firstPriceIndex = rowText.indexOf(firstPriceMatch[0]);
        const codeIndex = rowText.indexOf(code);
        
        if (codeIndex >= 0 && firstPriceIndex > codeIndex) {
          const startIndex = codeIndex + code.length;
          const descText = rowText.substring(startIndex, firstPriceIndex).trim();
          description = descText.replace(/\s+/g, " ").replace(/^[\d\-\s]+/, "").trim();
        }
      }

      if (!description || description.length < 3) {
        analysis.short_desc.count++;
        if (analysis.short_desc.samples.length < 5) {
          analysis.short_desc.samples.push(`Row ${rowIdx}: code="${code}" desc="${description}" (${description.length} chars)`);
        }
        continue;
      }

      if (description.match(/^%/) || description.match(/^\d+,\d+/)) {
        analysis.short_desc.count++;
        if (analysis.short_desc.samples.length < 5) {
          analysis.short_desc.samples.push(`Row ${rowIdx}: code="${code}" starts with invalid: "${description.substring(0, 30)}"`);
        }
        continue;
      }

      // Valid product
      analysis.products.count++;
      if (analysis.products.samples.length < 10) {
        analysis.products.samples.push(`Row ${rowIdx}: [${code}] ${description.substring(0, 40)}`);
      }
    }

    console.log("=== ROW ANALYSIS ===\n");
    for (const [category, data] of Object.entries(analysis)) {
      console.log(`${category}: ${data.count} rows`);
      if (data.samples.length > 0) {
        data.samples.forEach(s => console.log(`  - ${s}`));
      }
      console.log();
    }

    const totalAnalyzed = Object.values(analysis).reduce((sum, d) => sum + d.count, 0);
    console.log(`Total analyzed: ${totalAnalyzed}`);
    console.log(`Coverage: ${Math.round((analysis.products.count / 463) * 100)}%`);

  } catch (error) {
    console.error("Error:", error);
  }
}

analyzeOCRComplete();
