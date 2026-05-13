import { RequestHandler } from "express";
import * as path from "path";
import * as fs from "fs";
import { priceData } from "../index";

// Cloudflare-safe directory resolution
const getDataDir = () => path.resolve(process.cwd(), "server/data");

export interface ImportProduct {
  code: string;
  description: string;
  price: number;
  priceWithIPI: number;
}

/**
 * Import products from CSV format
 */
export const importProducts: RequestHandler = (req, res) => {
  try {
    const { products } = req.body;

    if (!Array.isArray(products)) {
      res.status(400).json({
        success: false,
        error: "Products must be an array",
      });
      return;
    }

    if (products.length === 0) {
      res.status(400).json({
        success: false,
        error: "At least one product is required",
      });
      return;
    }

    // Validate products
    const validProducts = products.filter((p: any) => {
      return (
        p.code &&
        typeof p.code === "string" &&
        p.description &&
        typeof p.description === "string" &&
        typeof p.price === "number" &&
        typeof p.priceWithIPI === "number"
      );
    });

    if (validProducts.length === 0) {
      res.status(400).json({
        success: false,
        error: "No valid products found",
      });
      return;
    }

    // Add or update products in priceData
    validProducts.forEach((newProduct: ImportProduct) => {
      const existingIndex = priceData.findIndex(
        (p: any) => p.code.toLowerCase() === newProduct.code.toLowerCase()
      );

      const product = {
        code: newProduct.code,
        description: newProduct.description,
        manufacturer: newProduct.code.split("-")[0] || "Geral",
        resalePrice: newProduct.price,
        resalePriceWithIPI: newProduct.priceWithIPI,
        distributorPrice: newProduct.price,
        distributorPriceWithIPI: newProduct.priceWithIPI,
        finalPrice: newProduct.price,
        finalPriceWithIPI: newProduct.priceWithIPI,
      };

      if (existingIndex >= 0) {
        // Update existing
        priceData[existingIndex] = {
          ...priceData[existingIndex],
          ...product,
        };
      } else {
        // Add new
        priceData.push(product);
      }
    });

    // Save to JSON file (try-catch for Cloudflare compatibility)
    try {
      const jsonPath = path.resolve(getDataDir(), "priceData.json");
      const dataDir = path.dirname(jsonPath);

      // Create data directory if it doesn't exist
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      fs.writeFileSync(jsonPath, JSON.stringify(priceData, null, 2), "utf-8");
    } catch (fileError) {
      console.warn("[importProducts] Could not save to filesystem (not supported on this platform):", fileError);
    }

    res.json({
      success: true,
      message: `${validProducts.length} product(s) imported successfully`,
      count: validProducts.length,
      totalProducts: priceData.length,
    });
  } catch (error) {
    console.error("Error importing products:", error);
    res.status(500).json({
      success: false,
      error: "Failed to import products",
    });
  }
};

/**
 * Delete all products
 */
export const deleteAllProducts: RequestHandler = (req, res) => {
  try {
    const deletedCount = priceData.length;

    if (deletedCount === 0) {
      return res.json({
        success: true,
        message: "No products to delete",
        deletedCount: 0,
      });
    }

    // Clear the priceData array
    priceData.length = 0;

    // Try to save empty array to JSON file (non-critical)
    try {
      const jsonPath = path.resolve(getDataDir(), "priceData.json");
      const dataDir = path.dirname(jsonPath);

      // Create data directory if it doesn't exist
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      fs.writeFileSync(jsonPath, JSON.stringify([], null, 2), "utf-8");
    } catch (fileError) {
      console.error("Warning: Could not save deletion to file:", fileError);
      // Continue anyway - the important thing is that priceData is cleared
    }

    res.json({
      success: true,
      message: `${deletedCount} product(s) deleted successfully`,
      deletedCount,
    });
  } catch (error) {
    console.error("Error deleting products:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete products",
    });
  }
};
