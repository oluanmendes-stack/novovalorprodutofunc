const fs = require('fs');

console.log("\n=== OCR JSON STRUCTURE DEBUG ===\n");

const fileContent = fs.readFileSync("/root/app/code/Tabela de Preços.json", "utf-8");
const ocrData = JSON.parse(fileContent);

console.log(`Total pages: ${ocrData.pages?.length || 0}\n`);

if (ocrData.pages && ocrData.pages.length > 0) {
  const firstPage = ocrData.pages[0];
  console.log(`First page ID: ${firstPage.page_id}`);
  console.log(`Content items: ${firstPage.content?.length || 0}\n`);

  console.log("First 30 text items:");
  if (firstPage.content) {
    for (let i = 0; i < Math.min(30, firstPage.content.length); i++) {
      const item = firstPage.content[i];
      const yPos = item.position ? Math.round(item.position[1]) : 0;
      const xPos = item.position ? Math.round(item.position[0]) : 0;
      console.log(`[${i}] Y=${yPos} X=${xPos} "${item.text}"`);
    }
  }

  // Group by Y to see rows
  console.log("\n\nGrouping by Y position:");
  const textsByY = new Map();
  
  if (firstPage.content) {
    for (const item of firstPage.content) {
      if (item.text && item.position) {
        const yPos = Math.round(item.position[1]);
        const xPos = Math.round(item.position[0]);
        if (!textsByY.has(yPos)) {
          textsByY.set(yPos, []);
        }
        textsByY.get(yPos).push({ text: item.text.trim(), xPos });
      }
    }
  }

  const yPositions = Array.from(textsByY.keys()).sort((a, b) => a - b);
  console.log(`Total unique Y positions: ${yPositions.length}\n`);
  
  console.log("First 15 rows:");
  for (let i = 0; i < Math.min(15, yPositions.length); i++) {
    const yPos = yPositions[i];
    const items = textsByY.get(yPos);
    // Sort by X position
    items.sort((a, b) => a.xPos - b.xPos);
    const rowStr = items.map(it => it.text).join(" | ");
    console.log(`Row ${i}: ${rowStr.substring(0, 200)}`);
  }

  // Find prices
  console.log("\n\nSearching for prices:");
  const pricePattern = /\d{1,3}(?:\.\d{3})*,\d{2}/g;
  let priceCount = 0;
  const sampleRows = [];

  if (firstPage.content) {
    for (const item of firstPage.content) {
      const matches = item.text.match(pricePattern);
      if (matches) {
        priceCount += matches.length;
        if (sampleRows.length < 5) {
          sampleRows.push({ text: item.text, prices: matches });
        }
      }
    }
  }

  console.log(`Total price occurrences in page 1: ${priceCount}\n`);
  console.log("Sample items with prices:");
  sampleRows.forEach((row, i) => {
    console.log(`${i + 1}. "${row.text}" -> [${row.prices.join(", ")}]`);
  });
}

// Summary
console.log("\n\n=== PAGE SUMMARY ===");
let totalItems = 0;
ocrData.pages.forEach((page, idx) => {
  const count = page.content?.length || 0;
  totalItems += count;
  console.log(`Page ${page.page_id}: ${count} items`);
});
console.log(`\nTotal items across all pages: ${totalItems}`);
