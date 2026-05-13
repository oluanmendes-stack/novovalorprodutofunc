import * as fs from "fs";
import * as path from "path";

function parseBrazilianPrice(priceStr: string): number {
  if (!priceStr) return 0;
  const cleaned = priceStr.trim().replace(/\./g, "");
  const normalized = cleaned.replace(",", ".");
  return parseFloat(normalized);
}

async function debugOCRParsing() {
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

    console.log(`Total rows: ${allRows.length}\n`);

    let headerSkipped = false;
    let extracted = 0;
    let skipped = 0;
    let skipReasons: {[key: string]: number} = {};

    const sampleExtracted: string[] = [];
    const sampleSkipped: string[] = [];

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

      try {
        const priceMatches = rowText.match(/\d{1,3}(?:\.\d{3})*,\d{2}/g) || [];
        const prices = priceMatches.map(parseBrazilianPrice);
        
        if (prices.length < 3) {
          skipped++;
          skipReasons["< 3 prices"] = (skipReasons["< 3 prices"] || 0) + 1;
          if (sampleSkipped.length < 5) {
            sampleSkipped.push(`Row ${rowIdx}: "${rowText.substring(0, 80)}..." (${prices.length} prices)`);
          }
          continue;
        }

        const tokens = rowText.trim().split(/\s+/);
        
        if (tokens.length < 5) {
          skipped++;
          skipReasons["< 5 tokens"] = (skipReasons["< 5 tokens"] || 0) + 1;
          continue;
        }

        let codeIdx = -1;
        let code = "";
        
        for (let i = 0; i < Math.min(5, tokens.length); i++) {
          const token = tokens[i];
          if (token.match(/^[A-Z0-9\-\.]+$/i) && !token.match(/^\d+%?$/) && token.length > 2 && token.length < 15) {
            code = token.toUpperCase();
            codeIdx = i;
            break;
          }
        }

        if (!code || code.length === 0) {
          skipped++;
          skipReasons["no code"] = (skipReasons["no code"] || 0) + 1;
          if (sampleSkipped.length < 5) {
            sampleSkipped.push(`Row ${rowIdx}: "${rowText.substring(0, 80)}..." (no code found)`);
          }
          continue;
        }

        let descriptionTokens: string[] = [];
        
        const firstPriceMatch = rowText.match(/\d{1,3}(?:\.\d{3})*,\d{2}/);
        if (firstPriceMatch) {
          const firstPriceIndex = rowText.indexOf(firstPriceMatch[0]);
          const textBeforePrice = rowText.substring(0, firstPriceIndex);
          const codeIndex = textBeforePrice.indexOf(code);
          
          if (codeIndex >= 0) {
            const afterCode = textBeforePrice.substring(codeIndex + code.length).trim();
            descriptionTokens = afterCode.split(/\s+/).filter(t => t.length > 0);
          }
        }

        const description = descriptionTokens.join(" ").trim();

        if (!description || description.length < 5) {
          skipped++;
          skipReasons["no/short desc"] = (skipReasons["no/short desc"] || 0) + 1;
          if (sampleSkipped.length < 5) {
            sampleSkipped.push(`Row ${rowIdx}: code="${code}" desc="${description}" (too short)`);
          }
          continue;
        }

        extracted++;
        if (sampleExtracted.length < 10) {
          sampleExtracted.push(`Row ${rowIdx}: [${code}] ${description} - ${prices.length} prices`);
        }

      } catch (e) {
        skipped++;
        skipReasons["error"] = (skipReasons["error"] || 0) + 1;
        continue;
      }
    }

    console.log(`=== PARSING RESULTS ===`);
    console.log(`Extracted: ${extracted}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Total: ${extracted + skipped}`);
    console.log(`Coverage: ${Math.round((extracted / 463) * 100)}%\n`);
    
    console.log(`=== SKIP REASONS ===`);
    for (const [reason, count] of Object.entries(skipReasons).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${reason}: ${count}`);
    }

    console.log(`\n=== SAMPLE EXTRACTED (${sampleExtracted.length}) ===`);
    sampleExtracted.forEach(s => console.log(`  ${s}`));

    console.log(`\n=== SAMPLE SKIPPED (${sampleSkipped.length}) ===`);
    sampleSkipped.forEach(s => console.log(`  ${s}`));

    // Now check what rows are after extracted products
    console.log(`\n=== ANALYZING CONTINUATION ROWS ===`);
    
    let continuationCount = 0;
    for (let i = 4; i < Math.min(30, allRows.length); i++) {
      const row = allRows[i];
      const rowText = row.join(" ");
      const priceMatches = rowText.match(/\d{1,3}(?:\.\d{3})*,\d{2}/g) || [];
      
      if (priceMatches.length > 0 && !rowText.match(/^[A-Z0-9]/i)) {
        console.log(`Row ${i}: (continuation) "${rowText.substring(0, 100)}..."`);
        continuationCount++;
      }
    }
    console.log(`Found ${continuationCount} continuation rows in sample`);

  } catch (error) {
    console.error("Error:", error);
  }
}

debugOCRParsing();
