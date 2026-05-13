import { RequestHandler } from "express";
import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

const apiKey = process.env.VITE_GOOGLE_DRIVE_API_KEY;
const catalogFolderId = '1gBxvgpDfyYJ34oYLGZOxru-4wO1hlp6i';

// Initialize Supabase client for catalog lookups
function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("[Catalogs] ERRO: Supabase credentials not configured");
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
}

async function findSupabaseCatalog(code: string): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    console.log(`[Catalogs] Buscando no Supabase: "${code}"`);

    const { data, error } = await supabase
      .storage
      .from("catalogs")
      .list("", { limit: 1000 });

    if (error) {
      console.error(`[Catalogs] Supabase erro:`, error);
      return null;
    }

    if (!data || data.length === 0) {
      console.log(`[Catalogs] Nenhum arquivo no Supabase`);
      return null;
    }

    const codeLower = code.toLowerCase();
    for (const file of data) {
      const nameLower = file.name.toLowerCase();
      if (
        nameLower.includes(codeLower) &&
        (nameLower.endsWith(".doc") ||
          nameLower.endsWith(".docx") ||
          nameLower.endsWith(".pdf"))
      ) {
        const { data: signedData } = await supabase
          .storage
          .from("catalogs")
          .createSignedUrl(file.name, 3600);

        if (signedData?.signedUrl) {
          console.log(`✓ Catálogo encontrado no Supabase: ${file.name}`);
          return signedData.signedUrl;
        }
      }
    }

    return null;
  } catch (error) {
    console.error("[Catalogs] Erro ao buscar no Supabase:", error);
    return null;
  }
}

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

    // Try Google Drive first
    console.log(`[Catalogs] Tentando Google Drive...`);
    let catalogUrl = await findGoogleDriveCatalog(code);
    let source = "google-drive";

    // If not found in Google Drive, try Supabase
    if (!catalogUrl) {
      console.log(`[Catalogs] Não encontrado no Google Drive, tentando Supabase...`);
      catalogUrl = await findSupabaseCatalog(code);
      source = "supabase";
    }

    if (catalogUrl) {
      console.log(`[Catalogs] ✓ BUSCA COMPLETA - Catálogo encontrado\n`);
      res.json({
        success: true,
        data: {
          code,
          path: catalogUrl,
          paths: [catalogUrl],
          source,
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
