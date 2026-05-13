import * as fs from "fs";
import * as path from "path";

async function debugOCRJson() {
  try {
    const jsonPath = path.resolve("./Tabela de Preços.json");
    const fileContent = fs.readFileSync(jsonPath, "utf-8");
    const ocrData = JSON.parse(fileContent);

    console.log("\n=== OCR JSON STRUCTURE ANALYSIS ===\n");
    console.log(`Total pages: ${ocrData.pages ? ocrData.pages.length : 0}`);
    console.log(`Total text items: ${ocrData.pages?.reduce((sum: number, p: any) => sum + (p.content?.length || 0), 0) || 0}\n`);

    // Analyze first page structure
    if (ocrData.pages && ocrData.pages.length > 0) {
      const firstPage = ocrData.pages[0];
      console.log(`First page structure:`);
      console.log(`  - page_id: ${firstPage.page_id}`);
      console.log(`  - content items: ${firstPage.content?.length || 0}`);
      
      if (firstPage.content && firstPage.content.length > 0) {
        const firstItem = firstPage.content[0];
        console.log(`\nFirst item structure:`);
        console.log(JSON.stringify(firstItem, null, 2).substring(0, 300));
      }
    }

    // Group text items by Y position (rows)
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

    // Group by Y position (rows)
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

    console.log(`\nTotal rows after grouping: ${allRows.length}\n`);
    
    // Helper function
    function isPriceFormat(text: string): boolean {
      return /^\d{1,3}(?:\.\d{3})*,\d{2}$/.test(text.trim());
    }

    // Analyze first 20 rows
    console.log("=== FIRST 20 ROWS ANALYSIS ===\n");
    
    for (let i = 0; i < Math.min(20, allRows.length); i++) {
      const row = allRows[i];
      const rowText = row.join(" ");
      
      // Find prices
      const priceIndices: number[] = [];
      for (let j = 0; j < row.length; j++) {
        if (isPriceFormat(row[j])) {
          priceIndices.push(j);
        }
      }
      
      console.log(`Row ${i}:`);
      console.log(`  Items: [${row.map((r, idx) => `${idx}="${r}"`).join(", ")}]`);
      console.log(`  Prices found: ${priceIndices.length} at indices ${priceIndices.join(", ")}`);
      console.log(`  Full text: "${rowText}"`);
      console.log();
    }

    // Try to identify pattern
    console.log("=== ANALYZING PRICE PATTERNS ===\n");
    
    let rowsWithPrices = 0;
    let rowsWith3Prices = 0;
    let rowsWith5Prices = 0;
    let rowsWith6Prices = 0;
    
    for (const row of allRows) {
      const priceCount = row.filter(r => isPriceFormat(r)).length;
      
      if (priceCount > 0) rowsWithPrices++;
      if (priceCount >= 3) rowsWith3Prices++;
      if (priceCount >= 5) rowsWith5Prices++;
      if (priceCount >= 6) rowsWith6Prices++;
    }
    
    console.log(`Rows with prices: ${rowsWithPrices}`);
    console.log(`Rows with >= 3 prices: ${rowsWith3Prices}`);
    console.log(`Rows with >= 5 prices: ${rowsWith5Prices}`);
    console.log(`Rows with >= 6 prices: ${rowsWith6Prices}`);
    
    // Show some rows with prices
    console.log("\n=== SAMPLE ROWS WITH PRICES ===\n");
    
    let shown = 0;
    for (let i = 0; i < allRows.length && shown < 10; i++) {
      const row = allRows[i];
      const priceCount = row.filter(r => isPriceFormat(r)).length;
      
      if (priceCount > 0) {
        console.log(`Row ${i} (${priceCount} prices):`);
        console.log(`  [${row.map((r, idx) => `${idx}="${r}"`).join(", ")}]`);
        console.log();
        shown++;
      }
    }

  } catch (error) {
    console.error("Error:", error);
  }
}

debugOCRJson();
