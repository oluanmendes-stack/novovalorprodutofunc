import { RequestHandler } from "express";
import { priceData } from "../index";

/**
 * Debug endpoint to check specific product data
 * GET /api/debug/products?code=5L500
 */
export const getProductDebug: RequestHandler = (req, res) => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== "string") {
      return res.status(400).json({
        error: "Please provide a 'code' query parameter",
      });
    }

    const product = priceData.find(
      (p: any) => p.code.toLowerCase() === code.toLowerCase()
    );

    if (!product) {
      return res.status(404).json({
        error: `Product with code '${code}' not found`,
        totalProducts: priceData.length,
        searchedFor: code,
      });
    }

    res.json({
      success: true,
      product,
      allProducts: priceData.length,
    });
  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({
      error: "Debug error",
    });
  }
};

/**
 * Debug endpoint to list all products (paginated)
 * GET /api/debug/all-products?page=0&limit=20
 */
export const getAllProductsDebug: RequestHandler = (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 0;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const start = page * limit;
    const end = start + limit;
    const items = priceData.slice(start, end);

    res.json({
      success: true,
      page,
      limit,
      total: priceData.length,
      hasMore: end < priceData.length,
      items,
    });
  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({
      error: "Debug error",
    });
  }
};

/**
 * Search products by code or description
 * GET /api/debug/search?q=W0013C
 */
export const searchProductsDebug: RequestHandler = (req, res) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== "string") {
      return res.status(400).json({
        error: "Please provide a 'q' query parameter",
      });
    }

    const searchTerm = q.toLowerCase();
    const results = priceData.filter(
      (p: any) =>
        p.code?.toLowerCase().includes(searchTerm) ||
        p.description?.toLowerCase().includes(searchTerm) ||
        p.manufacturer?.toLowerCase().includes(searchTerm)
    );

    res.json({
      success: true,
      query: q,
      found: results.length,
      results: results.slice(0, 10), // Limit to 10 results
    });
  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({
      error: "Debug error",
    });
  }
};
