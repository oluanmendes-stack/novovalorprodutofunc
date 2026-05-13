import { RequestHandler } from "express";

/**
 * Proxy images from Google Drive
 * Strategy:
 * 1. Try API method first (if API key is configured) for authorized files
 * 2. Fallback to direct download link for public files (drive.google.com/uc)
 * 3. If API fails, redirect to direct link (client-side fallback)
 *
 * Usage: /api/proxy-google-image?url=<encoded_url>
 */
export const proxyGoogleDriveImage: RequestHandler = async (req, res) => {
  try {
    const { url } = req.query;

    if (!url || typeof url !== "string") {
      console.error("[GoogleDriveProxy] ❌ URL parameter is required");
      return res.status(400).json({ error: "URL parameter is required" });
    }

    // Validate that it's a Google Drive URL
    if (!url.includes("drive.google.com") && !url.includes("googleapis.com")) {
      console.error(`[GoogleDriveProxy] ❌ Invalid URL domain: ${url.substring(0, 80)}`);
      return res.status(400).json({ error: "Only Google Drive URLs are allowed" });
    }

    console.log(`[GoogleDriveProxy] 🔄 Proxying image: ${url.substring(0, 100)}...`);

    // Extract file ID from Google Drive URL
    let fileId: string | null = null;
    const idMatch = url.match(/[?&]id=([^&]+)/);
    if (idMatch && idMatch[1]) {
      fileId = idMatch[1];
      console.log(`[GoogleDriveProxy]    File ID: ${fileId}`);
    }

    const apiKey = process.env.VITE_GOOGLE_DRIVE_API_KEY;
    let response: Response | null = null;
    let usedMethod = "unknown";

    // Strategy 1: Try API method first (for authorized files)
    if (apiKey && fileId) {
      try {
        usedMethod = "API (alt=media)";
        const apiUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`;
        console.log(`[GoogleDriveProxy]    Tentando método: ${usedMethod}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        response = await fetch(apiUrl, {
          signal: controller.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          console.log(
            `[GoogleDriveProxy] ✅ API method worked: ${response.status}`
          );
        } else if (response.status === 403 || response.status === 401) {
          console.warn(
            `[GoogleDriveProxy] ⚠️ API method failed (${response.status}), tentando método alternativo...`
          );
          response = null; // Null to trigger fallback
        } else {
          console.warn(
            `[GoogleDriveProxy] ⚠️ API method failed (${response.status}), tentando método alternativo...`
          );
          response = null;
        }
      } catch (apiError) {
        console.warn(
          `[GoogleDriveProxy] ⚠️ API method error: ${apiError instanceof Error ? apiError.message : String(apiError)}`
        );
        response = null; // Null to trigger fallback
      }
    }

    // Strategy 2: Try direct download link (for public/shared files)
    if (!response && fileId) {
      try {
        usedMethod = "Direct Download Link";
        const directUrl = `https://drive.google.com/uc?id=${fileId}&export=download`;
        console.log(`[GoogleDriveProxy]    Tentando método: ${usedMethod}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        response = await fetch(directUrl, {
          signal: controller.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": "https://drive.google.com/",
          },
          redirect: "follow",
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          console.log(
            `[GoogleDriveProxy] ✅ Direct download method worked: ${response.status}`
          );
        } else {
          console.warn(
            `[GoogleDriveProxy] ⚠️ Direct download failed (${response.status}), tentando fallback...`
          );
          response = null;
        }
      } catch (directError) {
        console.warn(
          `[GoogleDriveProxy] ⚠️ Direct download error: ${directError instanceof Error ? directError.message : String(directError)}`
        );
        response = null;
      }
    }

    // Strategy 3: Fallback to client-side redirect
    if (!response) {
      console.log(`[GoogleDriveProxy] ℹ️ Todos os métodos falharam, usando redirect do lado do cliente`);

      // Return a special response that tells the client to redirect
      // This works for files that are public but have CORS restrictions
      return res.status(307).json({
        error: "Cannot proxy this image",
        reason: "File requires authentication or has CORS restrictions",
        message:
          "O servidor não conseguiu fazer proxy desta imagem. Certifique-se de que: 1) O arquivo é público no Google Drive, ou 2) A chave de API do Google está configurada corretamente",
        fileId: fileId,
        fallbackUrl: fileId
          ? `https://drive.google.com/uc?id=${fileId}&export=view`
          : url,
        methods_tried: [
          "Google Drive API v3 (alt=media)",
          "Direct download link",
        ],
      });
    }

    // Get the content type
    const contentType = response.headers.get("content-type") || "image/jpeg";
    console.log(
      `[GoogleDriveProxy] ✅ Response: ${response.status} | Method: ${usedMethod}`
    );
    console.log(`[GoogleDriveProxy]    Content-Type: ${contentType}`);

    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400");

    // Stream the response
    const buffer = await response.arrayBuffer();
    const nodeBuffer = Buffer.from(buffer);
    res.setHeader("Content-Length", nodeBuffer.length);
    res.end(nodeBuffer);

    console.log(
      `[GoogleDriveProxy] ✅ Successfully proxied image (${nodeBuffer.length} bytes) via ${usedMethod}`
    );
  } catch (error) {
    console.error("[GoogleDriveProxy] ❌ Error:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);

    // Check if it's an abort/timeout error
    if (errorMsg.includes("AbortError") || errorMsg.includes("timeout")) {
      console.error("[GoogleDriveProxy]    Timeout ou conexão abortada");
      return res.status(504).json({
        error: "Gateway Timeout",
        message: "Timeout ao tentar buscar imagem do Google Drive (10s limite)",
      });
    }

    res.status(500).json({
      error: "Failed to proxy image",
      message: errorMsg,
      details: {
        errorType: error instanceof Error ? error.constructor.name : "Unknown",
      },
    });
  }
};
