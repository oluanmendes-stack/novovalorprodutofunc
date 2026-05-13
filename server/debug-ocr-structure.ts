import * as fs from "fs";

function debugOCRStructure() {
  const fileContent = fs.readFileSync("/root/app/code/Tabela de Preços.json", "utf-8");
  const ocrData = JSON.parse(fileContent);

  console.log("\n=== OCR JSON STRUCTURE DEBUG ===\n");
  console.log(`Total pages: ${ocrData.pages?.length || 0}`);

  // Get first page and analyze its structure
  if (ocrData.pages && ocrData.pages.length > 0) {
    const firstPage = ocrData.pages[0];
    console.log(`\nFirst page ID: ${firstPage.page_id}`);
    console.log(`Content items: ${firstPage.content?.length || 0}`);

    // Show first 50 items
    console.log("\nFirst 50 text items from page 1:");
    if (firstPage.content) {
      for (let i = 0; i < Math.min(50, firstPage.content.length); i++) {
        const item = firstPage.content[i];
        console.log(`[${i}] "${item.text}" pos=[${item.position?.[0]?.toFixed(0)}, ${item.position?.[1]?.toFixed(0)}]`);
      }
    }

    // Group by Y position to understand rows
    console.log("\n\nGrouping by Y position to understand rows:");
    const textsByY = new Map<number, string[]>();
    
    if (firstPage.content) {
      for (const item of firstPage.content) {
        if (item.text && item.position) {
          const yPos = Math.round(item.position[1]);
          if (!textsByY.has(yPos)) {
            textsByY.set(yPos, []);
          }
          textsByY.get(yPos)!.push(item.text.trim());
        }
      }
    }

    const yPositions = Array.from(textsByY.keys()).sort((a, b) => a - b);
    console.log(`\nTotal unique Y positions (rows): ${yPositions.length}`);
    
    // Show first 20 rows
    console.log("\nFirst 20 rows:");
    for (let i = 0; i < Math.min(20, yPositions.length); i++) {
      const yPos = yPositions[i];
      const rowTexts = textsByY.get(yPos)!;
      const rowStr = rowTexts.join(" | ");
      console.log(`Row ${i} (Y=${yPos}): ${rowStr.substring(0, 150)}`);
    }

    // Look for price patterns
    console.log("\n\nSearching for price patterns:");
    const pricePattern = /\d{1,3}(?:\.\d{3})*,\d{2}/g;
    let pricesFound = 0;
    const samplePrices: string[] = [];

    if (firstPage.content) {
      for (const item of firstPage.content) {
        if (item.text) {
          const matches = item.text.match(pricePattern);
          if (matches) {
            pricesFound += matches.length;
            if (samplePrices.length < 10) {
              samplePrices.push(`"${item.text}"`);
            }
          }
        }
      }
    }

    console.log(`Total prices found in page 1: ${pricesFound}`);
    console.log(`Sample items with prices:`);
    samplePrices.forEach((p, i) => console.log(`  ${i + 1}. ${p}`));
  }

  // Check all pages for content distribution
  console.log("\n\n=== ALL PAGES CONTENT DISTRIBUTION ===");
  ocrData.pages.forEach((page: any, idx: number) => {
    const contentCount = page.content?.length || 0;
    console.log(`Page ${page.page_id}: ${contentCount} items`);
  });
}

debugOCRStructure();
