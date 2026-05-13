/**
 * Service to find product images from Google Drive
 * Images are organized by product code in a shared Google Drive folder
 */

// Cache for checked image paths
const imageCache = new Map<string, string[]>();
// Cache for folder structure
const folderCache = new Map<string, { id: string; name: string }[]>();

const apiKey = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY;
const parentFolderId = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID;

// Debug log
console.log(`[GoogleDrive] 🔐 API Key configurada: ${!!apiKey}`);
console.log(`[GoogleDrive] 📁 Folder ID configurado: ${!!parentFolderId}`);
if (parentFolderId) {
  console.log(`[GoogleDrive]    Folder ID: ${parentFolderId}`);
}

/**
 * Search for images in a specific folder com paginação
 */
async function searchImagesInFolder(folderId: string, code: string, folderName: string = ''): Promise<string[]> {
  const images: string[] = [];
  const codeLower = code.toLowerCase();

  // Search for any images with the product code in filename
  const imageQuery = `'${folderId}' in parents and (mimeType='image/jpeg' or mimeType='image/png' or mimeType='image/gif' or mimeType='image/webp') and trashed=false`;

  try {
    console.log(`[GoogleDrive] 🔍 Procurando em pasta: ${folderName || folderId}`);
    console.log(`[GoogleDrive]    Código procurado: "${codeLower}"`);

    let pageToken = '';
    let pageNum = 1;
    let totalArquivos = 0;

    // Paginação: buscar 1000 resultados por página
    do {
      const tokenParam = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '';
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(imageQuery)}&fields=files(id,name,webViewLink),nextPageToken&pageSize=1000&orderBy=name&key=${apiKey}${tokenParam}`;

      console.log(`[GoogleDrive]    Página ${pageNum}...`);

      const response = await fetch(url);

      if (!response.ok) {
        console.warn(`[GoogleDrive] ❌ Erro na API ao buscar pasta ${folderName || folderId}: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error(`[GoogleDrive] ❌ Resposta completa de erro:`, errorText);
        break;
      }

      const data = await response.json();
      const fileCount = data.files?.length || 0;
      totalArquivos += fileCount;
      console.log(`[GoogleDrive]    Página ${pageNum}: ${fileCount} arquivo(s)`);

      if (data.files && data.files.length > 0) {
        for (const file of data.files) {
          const nameLower = file.name.toLowerCase();

          // Match if filename contains the product code (exact match or with common extensions)
          const codeWithoutExt = codeLower.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '');
          const fileWithoutExt = nameLower.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '');

          const matches = nameLower.includes(codeLower) || fileWithoutExt === codeWithoutExt || fileWithoutExt.includes(codeWithoutExt);

          if (matches) {
            // Use proxy endpoint that handles both public and private files
            // Locally it uses the proxy, in production it falls back as needed
            const directLink = `https://drive.google.com/uc?id=${file.id}&export=view`;
            const proxyUrl = `/api/proxy-google-image?url=${encodeURIComponent(directLink)}`;
            images.push(proxyUrl);
            console.log(`[GoogleDrive]      ✅ ${file.name} (ID: ${file.id})`);
          }
        }
      }

      pageToken = data.nextPageToken || '';
      pageNum++;
    } while (pageToken);

    console.log(`[GoogleDrive] 📁 Total de arquivos processados: ${totalArquivos}, Encontradas ${images.length} imagem(ns) contendo "${codeLower}"`);
  } catch (error) {
    console.error(`[GoogleDrive] ❌ Erro ao buscar pasta ${folderName || folderId}:`, error);
  }

  return images;
}

/**
 * Get all subfolders in a folder com paginação
 */
async function getSubfolders(folderId: string, parentName: string = ''): Promise<{id: string, name: string}[]> {
  const cacheKey = `subfolders_${folderId}`;
  if (folderCache.has(cacheKey)) {
    const cached = folderCache.get(cacheKey);
    if (cached) {
      console.log(`[GoogleDrive] 📦 Subpastas em cache de "${parentName}": ${cached.length} pasta(s)`);
      return cached;
    }
  }

  const subfolders: {id: string, name: string}[] = [];
  const folderQuery = `'${folderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;

  try {
    console.log(`[GoogleDrive] 📂 Listando subpastas de "${parentName || folderId}"...`);

    let pageToken = '';
    let pageNum = 1;

    do {
      const tokenParam = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '';
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(folderQuery)}&fields=files(id,name),nextPageToken&pageSize=1000&key=${apiKey}${tokenParam}`;

      const response = await fetch(url);

      if (!response.ok) {
        console.warn(`[GoogleDrive] ❌ Erro ao listar subpastas de "${parentName}": ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error(`[GoogleDrive] ❌ Resposta de erro:`, errorText);
        break;
      }

      const data = await response.json();
      console.log(`[GoogleDrive]    Página ${pageNum}: ${data.files?.length || 0} pasta(s)`);

      if (data.files && data.files.length > 0) {
        for (const folder of data.files) {
          subfolders.push({id: folder.id, name: folder.name});
          console.log(`[GoogleDrive]   📁 ${folder.name}`);
        }
      }

      pageToken = data.nextPageToken || '';
      pageNum++;
    } while (pageToken);

    console.log(`[GoogleDrive] 📦 Total de subpastas encontradas: ${subfolders.length}`);
    folderCache.set(cacheKey, subfolders);
  } catch (error) {
    console.error(`[GoogleDrive] ❌ Erro ao listar subpastas de "${parentName}":`, error);
    folderCache.set(cacheKey, []);
  }

  return subfolders;
}

/**
 * Recursively search for images in a folder and all subfolders
 */
async function recursiveSearchImages(folderId: string, code: string, folderName: string = '', depth: number = 0, maxDepth: number = 5): Promise<string[]> {
  const images: string[] = [];
  const indent = '  '.repeat(depth);

  if (depth > maxDepth) {
    console.log(`[GoogleDrive] ${indent}⚠️ Limite de profundidade atingido`);
    return images;
  }

  console.log(`[GoogleDrive] ${indent}🔍 Procurando imagens em "${folderName}"...`);

  // Search for images in current folder
  const currentImages = await searchImagesInFolder(folderId, code, folderName);
  images.push(...currentImages);

  if (currentImages.length > 0) {
    console.log(`[GoogleDrive] ${indent}✅ Encontradas ${currentImages.length} imagem(ns) em "${folderName}"`);
  }

  // Get subfolders and search recursively
  console.log(`[GoogleDrive] ${indent}📂 Listando subpastas de "${folderName}"...`);
  const subfolders = await getSubfolders(folderId, folderName);

  if (subfolders.length > 0) {
    console.log(`[GoogleDrive] ${indent}🔄 Encontradas ${subfolders.length} subpasta(s). Buscando recursivamente...`);
    for (const subfolder of subfolders) {
      console.log(`[GoogleDrive] ${indent}→ Entrando em subpasta: ${subfolder.name}`);
      const subImages = await recursiveSearchImages(subfolder.id, code, subfolder.name, depth + 1, maxDepth);
      images.push(...subImages);
    }
  } else {
    console.log(`[GoogleDrive] ${indent}📭 Nenhuma subpasta para descer em "${folderName}"`);
  }

  return images;
}

/**
 * Find images for a product code from Google Drive
 * Searches recursively through all folders in the root Google Drive folder
 *
 * Requires:
 * - VITE_GOOGLE_DRIVE_API_KEY environment variable
 * - VITE_GOOGLE_DRIVE_FOLDER_ID environment variable (folder containing product folders)
 *
 * @param code - Product code (used to match image filenames)
 * @returns Array of image URLs from Google Drive
 */
export async function findGoogleDriveImages(code: string): Promise<string[]> {
  // Check cache first
  if (imageCache.has(code)) {
    const cached = imageCache.get(code) || [];
    console.log(`[GoogleDrive] ♻️ Usando resultado em cache: ${cached.length} imagem(ns) para ${code}`);
    return cached;
  }

  if (!apiKey || !parentFolderId) {
    console.warn('[GoogleDrive] ❌ Configuração ausente: VITE_GOOGLE_DRIVE_API_KEY ou VITE_GOOGLE_DRIVE_FOLDER_ID');
    return [];
  }

  try {
    console.log(`\n[GoogleDrive] 🚀 ========== INICIANDO BUSCA ==========`);
    console.log(`[GoogleDrive] Código procurado: "${code}"`);
    console.log(`[GoogleDrive] ID da pasta raiz: ${parentFolderId}`);
    console.log(`[GoogleDrive] ======================================\n`);

    // Do a recursive search through all folders and subfolders
    const images = await recursiveSearchImages(parentFolderId, code, 'PASTA_RAIZ');

    // Cache the result
    imageCache.set(code, images);

    console.log(`\n[GoogleDrive] ========== RESULTADO FINAL ==========`);
    console.log(`[GoogleDrive] ✅ Total de imagens encontradas: ${images.length}`);
    if (images.length > 0) {
      images.forEach((url, idx) => {
        console.log(`[GoogleDrive]   ${idx + 1}. ${url}`);
        // Test if proxy URL is accessible
        console.log(`[GoogleDrive]      Testando URL: ${url.substring(0, 100)}...`);
      });
    }
    console.log(`[GoogleDrive] ======================================\n`);

    return images;
  } catch (error) {
    console.error(`[GoogleDrive] ❌ Erro ao buscar imagens para ${code}:`, error);
    imageCache.set(code, []);
    return [];
  }
}

/**
 * Clear the image cache
 * Useful when the folder structure changes
 */
export function clearGoogleDriveImageCache(): void {
  imageCache.clear();
  console.log('[GoogleDrive] Image cache cleared');
}
