import { RequestHandler } from "express";
import * as fs from "fs";
import * as path from "path";

const apiKey = process.env.VITE_GOOGLE_DRIVE_API_KEY;
const catalogFolderId = '1gBxvgpDfyYJ34oYLGZOxru-4wO1hlp6i';

async function findGoogleDriveCatalog(code: string): Promise<string | null> {
  if (!apiKey) {
    console.error("[Catalogs] ERRO: VITE_GOOGLE_DRIVE_API_KEY não está configurado");
    return null;
  }

  try {
    const codeLower = code.toLowerCase();
    const query = `'${catalogFolderId}' in parents and name contains '${codeLower}' and trashed=false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&key=${apiKey}&fields=files(id,name)`;

    console.log(`[Catalogs] Buscando no Google Drive: "${code}"`);

    const response = await fetch(url);
    if (!response.ok) {
      console.error(`[Catalogs] Erro na resposta da API: ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (data.files && data.files.length > 0) {
      for (const file of data.files) {
        const nameLower = file.name.toLowerCase();
        if (
          nameLower.includes(codeLower) &&
          (nameLower.endsWith(".doc") ||
            nameLower.endsWith(".docx") ||
            nameLower.endsWith(".pdf"))
        ) {
          const directLink = `https://drive.google.com/uc?id=${file.id}&export=view`;
          console.log(`✓ Catálogo encontrado: ${file.name}`);
          return directLink;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("[Catalogs] Erro ao buscar catálogo:", error);
    return null;
  }
}

export const findCatalogPath: RequestHandler = async (req, res) => {
  try {
    const code = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;

    if (!code) {
      res.status(400).json({
        success: false,
        error: "Código do produto obrigatório",
      });
      return;
    }

    console.log(`\n[Catalogs] BUSCA INICIADA: "${code}"`);
    console.log(`[Catalogs] Usando Google Drive`);

    const catalogUrl = await findGoogleDriveCatalog(code);

    if (catalogUrl) {
      const proxyUrl = `/api/proxy-google-image?url=${encodeURIComponent(catalogUrl)}`;
      console.log(`[Catalogs] ✓ BUSCA COMPLETA - Catálogo encontrado\n`);
      res.json({
        success: true,
        data: {
          code,
          path: proxyUrl,
          paths: [proxyUrl],
          source: "google-drive",
        },
      });
    } else {
      console.log(`[Catalogs] ✗ BUSCA COMPLETA - Não encontrado para: "${code}"\n`);
      res.status(404).json({
        success: false,
        error: "Catálogo não encontrado",
      });
    }
  } catch (error) {
    console.error("[findCatalogPath] ERRO:", error);
    res.status(500).json({
      success: false,
      error: "Falha ao buscar catálogo",
    });
  }
};

export const getCatalogFile: RequestHandler = async (req, res) => {
  try {
    const { catalogPath } = req.query;

    if (!catalogPath || typeof catalogPath !== "string") {
      res.status(400).json({
        success: false,
        error: "Caminho do catálogo obrigatório",
      });
      return;
    }

    const proxyUrl = `/api/proxy-google-image?url=${encodeURIComponent(catalogPath)}`;
    console.log(`[getCatalogFile] Redirecionando para proxy do Google Drive`);
    res.redirect(proxyUrl);
  } catch (error) {
    console.error("Erro ao servir catálogo:", error);
    res.status(500).json({
      success: false,
      error: "Falha ao servir catálogo",
    });
  }
};
