import * as fs from "fs";
import * as path from "path";

async function debugPDFDetailed() {
  try {
    // @ts-ignore
    const pdfModule = await import("pdf-parse");
    // @ts-ignore
    const pdfParse = pdfModule;

    const filePath = path.resolve("./Tabela de Preços.pdf");
    const fileBuffer = fs.readFileSync(filePath);

    // @ts-ignore
    const data = await pdfParse(fileBuffer);
    const linhas = data.text.split("\n");

    console.log(`\n=== PDF EXTRACTION DEBUG ===`);
    console.log(`Total lines in PDF: ${linhas.length}\n`);

    // REGEX IGUAL AO PYTHON
    const pricePatternStr = /^\d{1,3}(?:\.\d{3})*,\d{2}$/;
    const pricePatternGlobal = /\d{1,3}(?:\.\d{3})*,\d{2}/g;

    let validProducts = 0;
    let linesWithPrices = 0;
    let linesWithEnoughPrices = 0;

    // Analisa primeiras 50 linhas com detalhes
    console.log("=== FIRST 50 LINES WITH PRICE ANALYSIS ===\n");

    for (let lineIdx = 0; lineIdx < Math.min(50, linhas.length); lineIdx++) {
      const linha = linhas[lineIdx];

      if (!linha.trim()) continue;

      const pricesInLine = linha.match(pricePatternGlobal) || [];

      if (pricesInLine.length > 0) {
        linesWithPrices++;

        const colunas = linha.split(/\s+/);
        const indicesPrecos: number[] = [];

        for (let i = 0; i < colunas.length; i++) {
          if (pricePatternStr.test(colunas[i])) {
            indicesPrecos.push(i);
          }
        }

        console.log(`Line ${lineIdx}:`);
        console.log(`  Raw: ${linha.substring(0, 100)}...`);
        console.log(`  Prices found: ${pricesInLine.length}`);
        console.log(`  Price values: ${pricesInLine.join(", ")}`);
        console.log(`  Column indices: ${colunas.map((c, i) => `[${i}]=${c}`).join(" ")}`);
        console.log(`  Price indices: ${indicesPrecos.join(", ")}`);

        if (indicesPrecos.length >= 5) {
          linesWithEnoughPrices++;

          try {
            const code = colunas[0]?.trim() || "";
            const firstPriceIdx = indicesPrecos[0];
            const descricao = colunas.slice(3, firstPriceIdx).join(" ").trim();

            if (code && descricao) {
              validProducts++;
              console.log(`  ✓ VALID PRODUCT: ${code} - ${descricao}`);
              console.log(`    - Code: ${code}`);
              console.log(`    - Description: ${descricao}`);
              console.log(`    - Fabricante: ${colunas[2]}`);
              if (indicesPrecos.length > 3) {
                console.log(`    - Preço Revenda [3]: ${colunas[indicesPrecos[3]]}`);
              }
              if (indicesPrecos.length > 5) {
                console.log(`    - Preço Revenda c/ IPI [5]: ${colunas[indicesPrecos[5]]}`);
              }
            }
          } catch (e) {
            console.log(`  ✗ ERROR PARSING`);
          }
        }
        console.log();
      }
    }

    console.log("\n=== SUMMARY (First 50 lines) ===");
    console.log(`Lines with prices: ${linesWithPrices}`);
    console.log(`Lines with >= 5 prices: ${linesWithEnoughPrices}`);
    console.log(`Valid products extracted: ${validProducts}`);

    // Now scan ENTIRE PDF
    console.log(`\n=== SCANNING ENTIRE PDF ===`);

    validProducts = 0;
    linesWithEnoughPrices = 0;

    const products: any[] = [];

    for (const linha of linhas) {
      if (!linha.trim() || linha.includes("Descrição") || linha.includes("Venda")) {
        continue;
      }

      const pricesInLine = linha.match(pricePatternGlobal) || [];

      if (pricesInLine.length < 5) {
        continue;
      }

      const colunas = linha.split(/\s+/);
      const indicesPrecos: number[] = [];

      for (let i = 0; i < colunas.length; i++) {
        if (pricePatternStr.test(colunas[i])) {
          indicesPrecos.push(i);
        }
      }

      if (indicesPrecos.length < 5) continue;

      try {
        const code = colunas[0]?.trim() || "";
        const fabricante = colunas[2]?.trim() || "";
        const firstPriceIdx = indicesPrecos[0];
        const descricao = colunas.slice(3, firstPriceIdx).join(" ").trim();

        if (code && descricao) {
          const preco_revenda = colunas[indicesPrecos[3]] || "0,00";
          const preco_revenda_ipi =
            indicesPrecos.length > 5 ? colunas[indicesPrecos[5]] : "0,00";

          products.push({
            code,
            description: descricao,
            manufacturer: fabricante,
            precoRevenda: preco_revenda,
            precoRevendaIPI: preco_revenda_ipi,
          });

          validProducts++;
        }
      } catch (e) {
        // skip
      }
    }

    console.log(`Total products extracted: ${validProducts}`);
    console.log(`Target: 463 products`);

    if (validProducts === 463) {
      console.log("✓ SUCCESS: All 463 products extracted!");
    } else if (validProducts > 0) {
      console.log(`⚠ PARTIAL: ${validProducts}/${463} (${Math.round((validProducts / 463) * 100)}%)`);
    } else {
      console.log("✗ FAILED: No products extracted");
    }

    // Show first 10 and last 10 products
    console.log("\n=== FIRST 10 PRODUCTS ===");
    products.slice(0, 10).forEach((p, i) => {
      console.log(`${i + 1}. [${p.code}] ${p.description}`);
      console.log(`   Preço Revenda: ${p.precoRevenda}`);
      console.log(`   Preço Revenda c/ IPI: ${p.precoRevendaIPI}\n`);
    });

    if (products.length > 10) {
      console.log("=== LAST 10 PRODUCTS ===");
      products.slice(-10).forEach((p, i) => {
        console.log(`${products.length - 10 + i + 1}. [${p.code}] ${p.description}`);
        console.log(`   Preço Revenda: ${p.precoRevenda}`);
        console.log(`   Preço Revenda c/ IPI: ${p.precoRevendaIPI}\n`);
      });
    }

    // Save to JSON for inspection
    fs.writeFileSync(
      "debug-extracted-products.json",
      JSON.stringify(products, null, 2)
    );
    console.log(
      `\n✓ Extracted products saved to: debug-extracted-products.json`
    );
  } catch (error) {
    console.error("Error:", error);
  }
}

debugPDFDetailed();
