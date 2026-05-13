import { RequestHandler } from "express";
import * as fs from "fs";
import * as path from "path";

// Cloudflare-safe directory resolution
const getPublicDir = () => path.resolve(process.cwd(), "public");
const getDescriptorDir = () => path.resolve(getPublicDir(), "catalogo/descritivos");

/**
 * Normalize product code for consistent matching
 */
function normalizeCode(code: string): string {
  return code
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "");
}

/**
 * Get descriptor file for a product code
 */
function getDescriptorPath(productCode: string): string | null {
  try {
    const descriptorDir = getDescriptorDir();

    if (!fs.existsSync(descriptorDir)) {
      return null;
    }

    const extensions = [".txt", ".md", ""];

    // Try exact match first
    for (const ext of extensions) {
      const filePath = path.join(descriptorDir, `${productCode}${ext}`);
      if (fs.existsSync(filePath)) {
        return filePath;
      }
    }

    // Try fuzzy matching
    const files = fs.readdirSync(descriptorDir);
    const normalizedCode = productCode.toLowerCase().trim();

    for (const file of files) {
      const normalizedFile = file.toLowerCase();
      const fileWithoutExt = normalizedFile.replace(/\.(txt|md)$/, "");

      // Exact match
      if (fileWithoutExt === normalizedCode) {
        return path.join(descriptorDir, file);
      }

      // Starts with code
      if (
        fileWithoutExt.startsWith(normalizedCode + "_") ||
        fileWithoutExt.startsWith(normalizedCode + " ")
      ) {
        return path.join(descriptorDir, file);
      }

      // Multi-code files
      const codeVariations = fileWithoutExt.split(/[\.\-_]+/);
      if (codeVariations.some((part) => part === normalizedCode)) {
        return path.join(descriptorDir, file);
      }

      // Substring match
      if (
        fileWithoutExt.includes(normalizedCode) &&
        normalizedCode.length > 3
      ) {
        return path.join(descriptorDir, file);
      }
    }

    return null;
  } catch (error) {
    console.error("Error finding descriptor path:", error);
    return null;
  }
}

/**
 * Get descriptor content for a product
 */
export const getDescriptor: RequestHandler = async (req, res) => {
  try {
    const code = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;

    if (!code) {
      res.status(400).json({
        success: false,
        error: "Product code required",
      });
      return;
    }

    const descriptorPath = getDescriptorPath(code);

    if (descriptorPath) {
      const content = fs.readFileSync(descriptorPath, "utf-8");
      res.json({
        success: true,
        data: {
          code,
          descriptor: content.trim(),
        },
      });
      return;
    }

    // Fallback to GitHub: try common file names
    const fileResolver = await import("../utils/file-resolver");
    const possibleFileNames = [`public/catalogo/descritivos/${code}.txt`, `public/catalogo/descritivos/${code}.md`, `public/catalogo/descritivos/${code}`];

    for (const fileName of possibleFileNames) {
      const buffer = await fileResolver.resolveFilePath("", fileName, { logNotFound: false });
      if (buffer) {
        const content = buffer.toString("utf-8");
        res.json({
          success: true,
          data: {
            code,
            descriptor: content.trim(),
          },
        });
        return;
      }
    }

    res.status(404).json({
      success: false,
      error: "Descriptor not found",
    });
  } catch (error) {
    console.error("Error reading descriptor:", error);
    res.status(500).json({
      success: false,
      error: "Failed to read descriptor",
    });
  }
};

/**
 * Extract ANVISA registration from descriptor
 */
export const getAnvisaRegistration: RequestHandler = async (req, res) => {
  try {
    const code = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;

    if (!code) {
      res.status(400).json({
        success: false,
        error: "Product code required",
      });
      return;
    }

    let content: string | null = null;

    // Try local file first
    const descriptorPath = getDescriptorPath(code);
    if (descriptorPath) {
      content = fs.readFileSync(descriptorPath, "utf-8");
    } else {
      // Fallback to GitHub
      const fileResolver = await import("../utils/file-resolver");
      const possibleFileNames = [`public/catalogo/descritivos/${code}.txt`, `public/catalogo/descritivos/${code}.md`, `public/catalogo/descritivos/${code}`];

      for (const fileName of possibleFileNames) {
        const buffer = await fileResolver.resolveFilePath("", fileName, { logNotFound: false });
        if (buffer) {
          content = buffer.toString("utf-8");
          break;
        }
      }
    }

    if (!content) {
      res.status(404).json({
        success: false,
        error: "Descriptor not found",
      });
      return;
    }

    // Search for "Registro:" followed by numbers (e.g., 80005430751)
    const match = content.match(/Registro:\s*(\d+)/i);

    if (!match || !match[1]) {
      res.status(404).json({
        success: false,
        error: "ANVISA registration not found in descriptor",
      });
      return;
    }

    res.json({
      success: true,
      data: {
        code,
        registration: match[1],
      },
    });
  } catch (error) {
    console.error("Error extracting ANVISA registration:", error);
    res.status(500).json({
      success: false,
      error: "Failed to extract ANVISA registration",
    });
  }
};

/**
 * Get descriptors for multiple product codes
 */
export const getMultipleDescriptors: RequestHandler = async (req, res) => {
  try {
    const { codes } = req.body;

    if (!Array.isArray(codes) || codes.length === 0) {
      res.status(400).json({
        success: false,
        error: "Array of product codes required",
      });
      return;
    }

    const fileResolver = await import("../utils/file-resolver");
    const descriptors = [];

    for (const code of codes) {
      const trimmedCode = code.trim();
      let content: string | null = null;

      // Try local file first
      const descriptorPath = getDescriptorPath(trimmedCode);
      if (descriptorPath) {
        content = fs.readFileSync(descriptorPath, "utf-8");
      } else {
        // Fallback to GitHub
        const possibleFileNames = [`public/catalogo/descritivos/${trimmedCode}.txt`, `public/catalogo/descritivos/${trimmedCode}.md`, `public/catalogo/descritivos/${trimmedCode}`];

        for (const fileName of possibleFileNames) {
          const buffer = await fileResolver.resolveFilePath("", fileName, { logNotFound: false });
          if (buffer) {
            content = buffer.toString("utf-8");
            break;
          }
        }
      }

      descriptors.push({
        code: trimmedCode,
        descriptor: content ? content.trim() : null,
      });
    }

    res.json({
      success: true,
      data: descriptors,
    });
  } catch (error) {
    console.error("Error reading descriptors:", error);
    res.status(500).json({
      success: false,
      error: "Failed to read descriptors",
    });
  }
};
