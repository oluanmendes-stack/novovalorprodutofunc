import { RequestHandler } from "express";
import { priceData } from "../index";

export interface ProductResponse {
  code: string;
  description: string;
  manufacturer: string;
  price: number;
  priceWithIPI: number;
}

/**
 * Get all products from price table
 */
export const getProducts: RequestHandler = (req, res) => {
  try {
    // Use the priceData loaded from Tabela de Preços.json
    const rawData = priceData && priceData.length > 0 ? priceData : [];

    // Transform to simplified product format
    const products: ProductResponse[] = rawData.map((item: any) => ({
      code: item.code,
      description: item.description,
      manufacturer: item.manufacturer,
      price: item.resalePrice,
      priceWithIPI: item.resalePriceWithIPI,
    }));

    res.json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch products",
    });
  }
};

/**
 * Search products by code or description
 */
export const searchProducts: RequestHandler = (req, res) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== "string") {
      res.status(400).json({
        success: false,
        error: "Search query required",
      });
      return;
    }

    const rawData = priceData && priceData.length > 0 ? priceData : [];
    const query = q.toLowerCase();

    const results: ProductResponse[] = rawData
      .filter((item: any) =>
        item.code.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      )
      .map((item: any) => ({
        code: item.code,
        description: item.description,
        manufacturer: item.manufacturer,
        price: item.resalePrice,
        priceWithIPI: item.resalePriceWithIPI,
      }))
      .slice(0, 20); // Limit to 20 results

    res.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).json({
      success: false,
      error: "Failed to search products",
    });
  }
};

/**
 * Get single product by code
 */
export const getProductByCode: RequestHandler = (req, res) => {
  try {
    const code = Array.isArray(req.params.code) ? req.params.code[0] : req.params.code;

    if (!code) {
      res.status(400).json({
        success: false,
        error: "Product code required",
      });
      return;
    }

    const rawData = priceData && priceData.length > 0 ? priceData : [];
    const product = rawData.find(
      (item: any) => item.code.toLowerCase() === code.toLowerCase()
    );

    if (!product) {
      res.status(404).json({
        success: false,
        error: "Product not found",
      });
      return;
    }

    res.json({
      success: true,
      data: {
        code: product.code,
        description: product.description,
        manufacturer: product.manufacturer,
        price: product.resalePrice,
        priceWithIPI: product.resalePriceWithIPI,
        distributorPrice: product.distributorPrice,
        distributorPriceWithIPI: product.distributorPriceWithIPI,
        finalPrice: product.finalPrice,
        finalPriceWithIPI: product.finalPriceWithIPI,
      },
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch product",
    });
  }
};
