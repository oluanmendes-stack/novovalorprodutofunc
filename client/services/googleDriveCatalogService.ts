/**
 * Service to find product catalogs from Google Drive
 * Catalogs are organized by product code in a shared Google Drive folder
 */

// Cache for checked catalog paths
const catalogCache = new Map<string, string | null>();
// Cache for folder structure
const folderCache = new Map<string, {id: string, name: string}[]>();

const apiKey = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY;
const catalogFolderId = '1gBxvgpDfyYJ34oYLGZOxru-4wO1hlp6i';

/**
 * Search for catalogs in a specific folder com paginação
 */
async function searchCatalogsInFolder(folderId: string, code: string, folderName: string = ''): Promise<string | null> {
  const codeLower = code.toLowerCase();

  // Search for catalog files (.pdf, .doc, .docx)
  const catalogQuery = `'${folderId}' in parents and (mimeType='application/pdf' or mimeType='application/msword' or mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document') and trashed=false`;

  try {
    console.log(`[GoogleDriveCatalog] 🔍 Procurando em pasta: ${folderName || folderId}`);

    let pageToken = '';
    let pageNum = 1;
    let totalArquivos = 0;

    // Paginação: buscar 1000 resultados por página
    do {
      const tokenParam = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '';
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(catalogQuery)}&fields=files(id,name,webViewLink,mimeType),nextPageToken&pageSize=1000&orderBy=name&key=${apiKey}${tokenParam}`;

      console.log(`[GoogleDriveCatalog]    Página ${pageNum}...`);

      const response = await fetch(url);

      if (!response.ok) {
        console.warn(`[GoogleDriveCatalog] ❌ Erro na API ao buscar pasta ${folderName || folderId}: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error(`[GoogleDriveCatalog] ❌ Resposta de erro:`, errorText);
        break;
      }

      const data = await response.json();
      const fileCount = data.files?.length || 0;
      totalArquivos += fileCount;
      console.log(`[GoogleDriveCatalog]    Página ${pageNum}: ${fileCount} arquivo(s)`);

      if (data.files && data.files.length > 0) {
        for (const file of data.files) {
          const nameLower = file.name.toLowerCase();

          // Match if filename contains the product code
          if (nameLower.includes(codeLower)) {
            // Use direct Google Drive link
            const directLink = `https://drive.google.com/uc?id=${file.id}&export=view`;
            console.log(`[GoogleDriveCatalog]   ✅ ENCONTRADO: ${file.name}`);
            return directLink;
          }
        }
      }

      pageToken = data.nextPageToken || '';
      pageNum++;
    } while (pageToken);

    console.log(`[GoogleDriveCatalog] 📁 Total de arquivos processados: ${totalArquivos}`);
  } catch (error) {
    console.error(`[GoogleDriveCatalog] ❌ Erro ao buscar pasta ${folderName || folderId}:`, error);
  }

  return null;
}

/**
 * Get all subfolders in a folder com paginação
 */
async function getSubfolders(folderId: string, parentName: string = ''): Promise<{id: string, name: string}[]> {
  const cacheKey = `subfolders_${folderId}`;
  if (folderCache.has(cacheKey)) {
    const cached = folderCache.get(cacheKey);
    if (cached) {
      console.log(`[GoogleDriveCatalog] 📦 Subpastas em cache de "${parentName}": ${cached.length} pasta(s)`);
      return cached;
    }
  }

  const subfolders: {id: string, name: string}[] = [];
  const folderQuery = `'${folderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;

  try {
    console.log(`[GoogleDriveCatalog] 📂 Listando subpastas de "${parentName || folderId}"...`);

    let pageToken = '';
    let pageNum = 1;

    do {
      const tokenParam = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '';
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(folderQuery)}&fields=files(id,name),nextPageToken&pageSize=1000&key=${apiKey}${tokenParam}`;

      const response = await fetch(url);

      if (!response.ok) {
        console.warn(`[GoogleDriveCatalog] ❌ Erro ao listar subpastas de "${parentName}": ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error(`[GoogleDriveCatalog] ❌ Resposta de erro:`, errorText);
        break;
      }

      const data = await response.json();
      console.log(`[GoogleDriveCatalog]    Página ${pageNum}: ${data.files?.length || 0} pasta(s)`);

      if (data.files && data.files.length > 0) {
        for (const folder of data.files) {
          subfolders.push({id: folder.id, name: folder.name});
          console.log(`[GoogleDriveCatalog]   📁 ${folder.name}`);
        }
      }

      pageToken = data.nextPageToken || '';
      pageNum++;
    } while (pageToken);

    console.log(`[GoogleDriveCatalog] 📦 Total de subpastas encontradas: ${subfolders.length}`);
    folderCache.set(cacheKey, subfolders);
  } catch (error) {
    console.error(`[GoogleDriveCatalog] ❌ Erro ao listar subpastas de "${parentName}":`, error);
    folderCache.set(cacheKey, []);
  }

  return subfolders;
}

/**
 * Recursively search for catalogs in a folder and all subfolders
 */
async function recursiveSearchCatalogs(folderId: string, code: string, folderName: string = '', depth: number = 0, maxDepth: number = 5): Promise<string | null> {
  const indent = '  '.repeat(depth);

  if (depth > maxDepth) {
    console.log(`[GoogleDriveCatalog] ${indent}⚠️ Limite de profundidade atingido`);
    return null;
  }

  console.log(`[GoogleDriveCatalog] ${indent}🔍 Procurando catálogos em "${folderName}"...`);

  // Search for catalogs in current folder
  const currentCatalog = await searchCatalogsInFolder(folderId, code, folderName);
  if (currentCatalog) {
    console.log(`[GoogleDriveCatalog] ${indent}✅ Encontrado catálogo em "${folderName}"`);
    return currentCatalog;
  }

  // Get subfolders and search recursively
  console.log(`[GoogleDriveCatalog] ${indent}📂 Listando subpastas de "${folderName}"...`);
  const subfolders = await getSubfolders(folderId, folderName);

  if (subfolders.length > 0) {
    console.log(`[GoogleDriveCatalog] ${indent}🔄 Encontradas ${subfolders.length} subpasta(s). Buscando recursivamente...`);
    for (const subfolder of subfolders) {
      console.log(`[GoogleDriveCatalog] ${indent}→ Entrando em subpasta: ${subfolder.name}`);
      const subCatalog = await recursiveSearchCatalogs(subfolder.id, code, subfolder.name, depth + 1, maxDepth);
      if (subCatalog) {
        return subCatalog;
      }
    }
  } else {
    console.log(`[GoogleDriveCatalog] ${indent}📭 Nenhuma subpasta para descer em "${folderName}"`);
  }

  return null;
}

/**
 * Find catalog for a product code from Google Drive
 * Searches recursively through all folders in the catalog folder
 *
 * Requires:
 * - VITE_GOOGLE_DRIVE_API_KEY environment variable
 *
 * @param code - Product code (used to match catalog filenames)
 * @returns Catalog URL from Google Drive or null if not found
 */
export async function findGoogleDriveCatalog(code: string): Promise<string | null> {
  // Check cache first
  if (catalogCache.has(code)) {
    const cached = catalogCache.get(code);
    console.log(`[GoogleDriveCatalog] ♻️ Usando resultado em cache: ${cached ? 'encontrado' : 'não encontrado'} para ${code}`);
    return cached || null;
  }

  if (!apiKey) {
    console.warn('[GoogleDriveCatalog] ❌ Configuração ausente: VITE_GOOGLE_DRIVE_API_KEY');
    return null;
  }

  try {
    console.log(`\n[GoogleDriveCatalog] 🚀 ========== INICIANDO BUSCA ==========`);
    console.log(`[GoogleDriveCatalog] Código procurado: "${code}"`);
    console.log(`[GoogleDriveCatalog] ID da pasta de catálogos: ${catalogFolderId}`);
    console.log(`[GoogleDriveCatalog] ======================================\n`);

    // Do a recursive search through all folders and subfolders
    const catalog = await recursiveSearchCatalogs(catalogFolderId, code, 'CATALOGO_RAIZ');

    // Cache the result
    catalogCache.set(code, catalog);

    console.log(`\n[GoogleDriveCatalog] ========== RESULTADO FINAL ==========`);
    if (catalog) {
      console.log(`[GoogleDriveCatalog] ✅ Catálogo encontrado`);
      console.log(`[GoogleDriveCatalog]    URL: ${catalog}`);
    } else {
      console.log(`[GoogleDriveCatalog] ❌ Catálogo não encontrado para: ${code}`);
    }
    console.log(`[GoogleDriveCatalog] ======================================\n`);

    return catalog;
  } catch (error) {
    console.error(`[GoogleDriveCatalog] ❌ Erro ao buscar catálogo para ${code}:`, error);
    catalogCache.set(code, null);
    return null;
  }
}

/**
 * Clear the catalog cache
 * Useful when the folder structure changes
 */
export function clearGoogleDriveCatalogCache(): void {
  catalogCache.clear();
  folderCache.clear();
  console.log('[GoogleDriveCatalog] Cache cleared');
}
