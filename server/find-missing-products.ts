import * as fs from "fs";
import * as path from "path";

function parseBrazilianPrice(priceStr: string): number {
  if (!priceStr) return 0;
  const cleaned = priceStr.trim().replace(/\./g, "");
  const normalized = cleaned.replace(",", ".");
  return parseFloat(normalized);
}

async function findMissing() {
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

    const rowsWithoutCode: string[] = [];
    const rowsWithoutDescription: string[] = [];
    const rowsWithoutValidPrice: string[] = [];
    const otherSkipped: string[] = [];

    let headerSkipped = false;
    let extracted = 0;

    for (let rowIdx = 0; rowIdx < allRows.length; rowIdx++) {
      const row = allRows[rowIdx];
      const rowText = row.join(" ");
      
      if (!headerSkipped && (
        rowText.includes("Item") ||
        rowText.includes("Descrição") ||
        rowText.includes("Distribuidor") ||
        rowText.includes("Revenda") ||
        rowText.length < 20
      )) {
        continue;
      }
      
      headerSkipped = true;
      
      if (row.length === 0 || rowText.trim() === "") {
        continue;
      }

      const priceMatches = rowText.match(/\d{1,3}(?:\.\d{3})*,\d{2}/g) || [];
      
      if (priceMatches.length === 0) {
        continue;
      }
      
      if (priceMatches.length < 3) {
        continue;
      }

      const tokens = rowText.trim().split(/\s+/);
      
      if (tokens.length < 6) {
        otherSkipped.push(`Row ${rowIdx}: too few tokens (${tokens.length}): "${rowText.substring(0, 60)}"`);
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
          if (token.match(/^%$/)) continue;
          if (i === 1 && token.match(/^\d+$/)) continue;
          
          const isValidCode = 
            ((token.match(/[A-Z]/i) && token.match(/[0-9\-\.]/)) && 
             token.length > 2 && token.length < 25) ||
            (token.match(/^\d{5,}$/) && token.length > 4 && !token.match(/^\d+%/)) ||
            (token.match(/^[A-Z]{2,10}$/) && token.length > 2 && token.length < 15 && i > 1);
          
          if (isValidCode && !token.match(/^\d{1,3}(?:\.\d{3})*,\d{2}/)) {
            code = token.toUpperCase();
            break;
          }
        }
      }

      if (!code || code.length === 0) {
        rowsWithoutCode.push(`Row ${rowIdx}: "${rowText.substring(0, 80)}"`);
        continue;
      }

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

      if (!description || description.length === 0) {
        description = code;
      }

      if (description.length === 0) {
        rowsWithoutDescription.push(`Row ${rowIdx}: code="${code}": "${rowText.substring(0, 80)}"`);
        continue;
      }

      if (description.match(/^%/) || description.match(/^\d+,\d+[%]*\s+\d+/)) {
        continue;
      }

      extracted++;
    }

    console.log(`=== SUMMARY ===\n`);
    console.log(`Extracted: ${extracted}`);
    console.log(`Target: 463`);
    console.log(`Missing: ${463 - extracted}\n`);

    console.log(`=== SKIPPED ROWS ANALYSIS ===\n`);
    console.log(`Rows without code: ${rowsWithoutCode.length}`);
    if (rowsWithoutCode.length > 0 && rowsWithoutCode.length <= 10) {
      rowsWithoutCode.forEach(r => console.log(`  ${r}`));
    }

    console.log(`\nRows without description: ${rowsWithoutDescription.length}`);
    if (rowsWithoutDescription.length > 0 && rowsWithoutDescription.length <= 10) {
      rowsWithoutDescription.forEach(r => console.log(`  ${r}`));
    }

    console.log(`\nOther skipped: ${otherSkipped.length}`);
    if (otherSkipped.length > 0 && otherSkipped.length <= 10) {
      otherSkipped.forEach(r => console.log(`  ${r}`));
    }

    // Try to find patterns in missing rows
    console.log(`\n=== SEARCHING FOR MISSING PRODUCTS ===\n`);
    
    // Look for rows that have prices but weren't extracted
    const missingCandidates: string[] = [];
    
    for (let rowIdx = 0; rowIdx < allRows.length; rowIdx++) {
      const row = allRows[rowIdx];
      const rowText = row.join(" ");
      
      const priceMatches = rowText.match(/\d{1,3}(?:\.\d{3})*,\d{2}/g) || [];
      
      // Look for rows with 5+ prices but weren't extracted
      if (priceMatches.length >= 5) {
        // Try to find any code-like pattern
        const tokens = rowText.trim().split(/\s+/);
        let foundCode = false;
        
        for (const token of tokens) {
          if ((token.match(/[A-Z]/i) && token.match(/[0-9\-\.]/) && token.length > 2 && token.length < 25) ||
              (token.match(/^\d{5,}$/) && token.length > 4)) {
            foundCode = true;
            break;
          }
        }
        
        if (!foundCode && rowText.length > 40) {
          // Potential missing product
          missingCandidates.push(`Row ${rowIdx}: "${rowText.substring(0, 100)}"`);
        }
      }
    }
    
    if (missingCandidates.length > 0) {
      console.log(`Potential missing products (${missingCandidates.length}):`);
      missingCandidates.slice(0, 10).forEach(c => console.log(`  ${c}`));
    }

  } catch (error) {
    console.error("Error:", error);
  }
}

findMissing();
