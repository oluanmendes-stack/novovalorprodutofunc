import * as fs from "fs";
import * as path from "path";

async function debugPDF() {
  try {
    // @ts-ignore
    const pdfModule = await import("pdf-parse");
    // @ts-ignore
    const pdfParse = pdfModule;

    const filePath = path.resolve("./Tabela de Preços.pdf");
    const fileBuffer = fs.readFileSync(filePath);

    // @ts-ignore
    const data = await pdfParse(fileBuffer);

    console.log("PDF Text extracted:");
    // @ts-ignore
    const lines = data.text.split("\n").slice(0, 30);
    lines.forEach((line, i) => {
      if (line.trim()) {
        console.log(`Line ${i}: ${line}`);
      }
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

debugPDF();
