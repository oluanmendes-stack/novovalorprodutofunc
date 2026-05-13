import { RequestHandler } from "express";
import * as fs from "fs";
import * as path from "path";
import { getImageStorageUrl } from "../lib/supabase-storage";

/**
 * Get the images folder path (legacy - for backwards compatibility)
 * Looks for the "imagens" folder in public/catalogo directory
 * Returns a dummy path since we now use Supabase Storage
 */
export function getImagesFolderPath(): string {
  // Return the most likely path for compatibility
  return path.resolve(process.cwd(), "public/catalogo/imagens");
}

/**
 * Set the images folder path (legacy - kept for compatibility)
 */
export function setImagesFolderPath(folderPath: string) {
  console.log(`Note: Images folder path is auto-detected from project root`);
}

/**
 * Synchronously find images for a product code
 * NOTE: This method is now limited since Supabase Storage doesn't support directory listing
 * For now, returns empty array. Use the async findProductImages instead.
 */
export function findProductImagesSync(code: string): string[] {
  console.warn("[findProductImagesSync] Sync method no longer supported. Use async findProductImages instead.");
  return [];
}

/**
 * Find images for a product code
 * Searches Supabase Storage in:
 * 1. Root folder (imagens/Y000P05.jpg)
 * 2. Brand folders (imagens/TECNOPRINT/Y000P05.jpg)
 * 3. Category folders (imagens/BOLSA PRESSORICA/Y000P05.jpg)
 * Returns list of image URLs that might exist
 */
export const findProductImages: RequestHandler = (req, res) => {
  try {
    const code = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;

    if (!code || code.trim() === "") {
      res.status(400).json({
        success: false,
        error: "Product code is required",
      });
      return;
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`[Images] SEARCH START: Product Code = "${code}"`);
    console.log(`[Images] Using Supabase Storage (root + brand folders)`);
    console.log(`${'='.repeat(60)}`);

    const images: string[] = [];
    const codeLower = code.toLowerCase().trim();
    const codeUpper = code.toUpperCase();

    // Common image naming patterns
    const basePatterns = [
      `${code}`,           // Exact case
      `${codeLower}`,      // Lowercase
      `${codeUpper}`,      // Uppercase
    ];

    // File extensions to try
    const extensions = ['.jpg', '.jpeg', '.png'];

    // Build all patterns including numbered suffixes and extensions
    const filenamePatterns: string[] = [];

    for (const basePattern of basePatterns) {
      // 1. Base pattern without extension
      filenamePatterns.push(basePattern);

      // 2. With hyphen-numbered suffixes (e.g., S0072B-L-1, S0072B-L-2)
      for (let i = 1; i <= 9; i++) {
        filenamePatterns.push(`${basePattern}-${i}`);
      }

      // 3. With parentheses-numbered suffixes (e.g., S0072B-L(1), S0072B-L(2))
      for (let i = 1; i <= 9; i++) {
        filenamePatterns.push(`${basePattern}(${i})`);
      }
    }

    // Add all extensions to all patterns
    const patternsWithExtensions: string[] = [];
    for (const pattern of filenamePatterns) {
      for (const ext of extensions) {
        patternsWithExtensions.push(`${pattern}${ext}`);
      }
    }

    // Combine base patterns (without extension) and patterns with extensions
    const allPatterns = [...filenamePatterns, ...patternsWithExtensions];

    // Known brand/category folders in Supabase Storage
    const brands = [
      "TECNOPRINT",
      "PHYSIO CONTROL",
      "MEDMAX",
      "MED-LINKET",
      "GABMED",
      "CONTEC",
    ];

    console.log(`[Images] Testing patterns in ROOT + ${brands.length} brands`);

    // 1. First, try ROOT folder (imagens/S0072B-L.jpg, imagens/S0072B-L(1).jpeg, etc.)
    console.log(`  Checking ROOT folder`);
    for (const pattern of allPatterns) {
      try {
        const storageUrl = getImageStorageUrl(pattern);
        if (storageUrl) {
          images.push(storageUrl);
        }
      } catch (err) {
        console.warn(`Could not generate URL for root/${pattern}`, err);
      }
    }
    console.log(`    ✓ Generated ${allPatterns.length} URLs for ROOT`);

    // 2. Then, try each BRAND folder (imagens/BRAND/S0072B-L.jpg, etc.)
    for (const brand of brands) {
      console.log(`  Checking brand: ${brand}`);
      for (const pattern of allPatterns) {
        try {
          const pathWithBrand = `${brand}/${pattern}`;
          const storageUrl = getImageStorageUrl(pathWithBrand);
          if (storageUrl) {
            images.push(storageUrl);
          }
        } catch (err) {
          console.warn(`Could not generate URL for ${brand}/${pattern}`, err);
        }
      }
      console.log(`    ✓ Generated ${allPatterns.length} URLs for ${brand}`);
    }

    console.log(`${'='.repeat(60)}`);
    console.log(`[Images] SEARCH COMPLETE`);
    console.log(`[Images] Total URLs generated: ${images.length}`);
    console.log(`[Images] Breakdown: ${allPatterns.length} (root) + ${brands.length}×${allPatterns.length} (brands) = ${allPatterns.length + brands.length * allPatterns.length}`);
    console.log(`[Images] Sample URLs (first 5):`);
    images.slice(0, 5).forEach(url => console.log(`    - ${url}`));
    console.log(`${'='.repeat(60)}\n`);

    res.json({
      success: true,
      data: images,
      count: images.length,
      message: images.length > 0
        ? `Generated ${images.length} image URL(s) to check for product code: ${code}`
        : `No URLs could be generated for product code: ${code}`,
    });
  } catch (error) {
    console.error("Error finding product images:", error);
    res.status(500).json({
      success: false,
      error: "Failed to find product images",
    });
  }
};

/**
 * Get a specific image file
 * Returns the image file as a response
 * Can also open the file on Windows systems using the openImage route
 */
export const getImageFile: RequestHandler = async (req, res) => {
  try {
    const { imagePath } = req.query;

    if (!imagePath || typeof imagePath !== "string") {
      res.status(400).json({
        success: false,
        error: "Image path is required",
      });
      return;
    }

    // Verify the file exists and is within the images folder
    const resolvedPath = path.resolve(imagePath);
    const resolvedImageFolder = path.resolve(getImagesFolderPath());

    if (!resolvedPath.startsWith(resolvedImageFolder)) {
      console.warn(`[getImageFile] Access denied: path outside folder - ${imagePath}`);
      res.status(403).json({
        success: false,
        error: "Access denied: Image path outside configured folder",
      });
      return;
    }

    // Try to serve from local filesystem first
    if (fs.existsSync(resolvedPath)) {
      const buffer = fs.readFileSync(resolvedPath);
      const ext = path.extname(resolvedPath).toLowerCase();
      const mimeTypes: Record<string, string> = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".bmp": "image/bmp",
      };
      const contentType = mimeTypes[ext] || "application/octet-stream";
      res.setHeader("Content-Type", contentType);
      res.send(buffer);
      return;
    }

    // Fallback to GitHub
    const fileResolver = await import("../utils/file-resolver");
    const gitHubPath = resolvedPath.replace(/\\/g, "/").replace(process.cwd(), "").replace(/^\//, "");
    const buffer = await fileResolver.resolveFilePath(resolvedPath, gitHubPath, { logNotFound: false });

    if (buffer) {
      // Set appropriate content type based on file extension
      const ext = path.extname(resolvedPath).toLowerCase();
      const mimeTypes: Record<string, string> = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".bmp": "image/bmp",
      };
      const contentType = mimeTypes[ext] || "application/octet-stream";
      res.setHeader("Content-Type", contentType);
      res.send(buffer);
      return;
    }

    res.status(404).json({
      success: false,
      error: "Image file not found",
    });
  } catch (error) {
    console.error("Error retrieving image file:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve image file",
    });
  }
};

/**
 * Open an image file (Windows only)
 * Equivalent to Python's os.startfile(img)
 * This opens the image with the system's default image viewer
 */
export const openImage: RequestHandler = (req, res) => {
  try {
    const { imagePath } = req.body;

    if (!imagePath || typeof imagePath !== "string") {
      res.status(400).json({
        success: false,
        error: "Image path is required",
      });
      return;
    }

    // Verify the file exists and is within the images folder
    const resolvedPath = path.resolve(imagePath);
    const resolvedImageFolder = path.resolve(getImagesFolderPath());

    if (!resolvedPath.startsWith(resolvedImageFolder)) {
      res.status(403).json({
        success: false,
        error: "Access denied: Image path outside configured folder",
      });
      return;
    }

    if (!fs.existsSync(resolvedPath)) {
      res.status(404).json({
        success: false,
        error: "Image file not found",
      });
      return;
    }

    // Try to open with system default viewer
    // This is platform-dependent:
    // - Windows: os.startfile()
    // - macOS: open command
    // - Linux: xdg-open command
    const { exec } = require("child_process");

    let command = "";
    if (process.platform === "win32") {
      command = `start "" "${resolvedPath}"`;
    } else if (process.platform === "darwin") {
      command = `open "${resolvedPath}"`;
    } else {
      command = `xdg-open "${resolvedPath}"`;
    }

    exec(command, (error: any) => {
      if (error) {
        console.error("Error opening image:", error);
        res.status(500).json({
          success: false,
          error: "Failed to open image",
        });
        return;
      }

      res.json({
        success: true,
        message: "Image opened successfully",
      });
    });
  } catch (error) {
    console.error("Error opening image:", error);
    res.status(500).json({
      success: false,
      error: "Failed to open image",
    });
  }
};
