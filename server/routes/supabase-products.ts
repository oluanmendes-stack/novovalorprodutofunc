import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";

const getSupabase = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;
  return url && key ? createClient(url, key) : null;
};

export interface ProductResponse {
  code: string;
  description: string;
  price: number;
  priceWithIPI: number;
}

/**
 * Get all products from Supabase
 */
export const getProducts: RequestHandler = async (req, res) => {
  try {
    const supabase = getSupabase();
    console.log("[getProducts] Supabase client initialized: ", !!supabase);

    if (!supabase) {
      console.error("[getProducts] Supabase client not initialized");
      return res.status(500).json({
        success: false,
        error: "Supabase not configured",
      });
    }

    console.log("[getProducts] Fetching products from Supabase...");
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("code");

    if (error) {
      console.error("[getProducts] Supabase error:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to fetch products from database",
      });
    }

    console.log("[getProducts] Received data:", data?.length || 0, "products");
    if (data && data.length > 0) {
      console.log("[getProducts] First product structure:", JSON.stringify(data[0], null, 2));
    }

    const products: ProductResponse[] = (data || []).map((item: any) => ({
      code: item.code,
      description: item.description,
      price: item.price_distributor_with_ipi || 0,
      priceWithIPI: item.price_final_with_ipi || 0,
    }));

    console.log("[getProducts] Mapped products:", products.length);
    res.json({
      success: true,
      data: products,
      count: products.length,
    });
  } catch (error) {
    console.error("[getProducts] Exception error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch products",
    });
  }
};

/**
 * Search products by code or description
 */
export const searchProducts: RequestHandler = async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: "Supabase not configured",
      });
    }

    const { q } = req.query;

    if (!q || typeof q !== "string") {
      return res.status(400).json({
        success: false,
        error: "Search query required",
      });
    }

    const query = q.toLowerCase();

    // Search for code or description matches
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .or(`code.ilike.%${query}%,description.ilike.%${query}%`)
      .order("code")
      .limit(20);

    if (error) {
      console.error("Error searching products:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to search products",
      });
    }

    const products: ProductResponse[] = (data || []).map((item: any) => ({
      code: item.code,
      description: item.description,
      price: item.price_distributor_with_ipi || 0,
      priceWithIPI: item.price_final_with_ipi || 0,
    }));

    res.json({
      success: true,
      data: products,
      count: products.length,
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
export const getProductByCode: RequestHandler = async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: "Supabase not configured",
      });
    }

    const { code } = req.params;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: "Product code required",
      });
    }

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("code", code)
      .single();

    if (error) {
      console.error("Error fetching product:", error);
      return res.status(404).json({
        success: false,
        error: "Product not found",
      });
    }

    const product: ProductResponse = {
      code: data.code,
      description: data.description,
      price: data.price_distributor_with_ipi || 0,
      priceWithIPI: data.price_final_with_ipi || 0,
    };

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch product",
    });
  }
};

/**
 * Import products to Supabase
 */
export const importProducts: RequestHandler = async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: "Supabase not configured",
      });
    }

    const { products } = req.body;

    if (!Array.isArray(products)) {
      return res.status(400).json({
        success: false,
        error: "Products must be an array",
      });
    }

    if (products.length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one product is required",
      });
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
      return res.status(400).json({
        success: false,
        error: "No valid products found",
      });
    }

    // Remove duplicates (keep first occurrence)
    const uniqueProducts = Array.from(
      new Map(validProducts.map((p) => [p.code, p])).values()
    );

    // Delete existing products with same codes first
    if (uniqueProducts.length > 0) {
      const codes = uniqueProducts.map((p) => p.code);
      await supabase
        .from("products")
        .delete()
        .in("code", codes);
    }

    // Transform products with flexible column mapping
    const transformedProducts = uniqueProducts.map((p: any) => {
      const baseObj: any = {
        code: p.code.trim(),
        description: p.description.trim(),
        marca: p.code.trim(),
      };

      // Map all price columns
      baseObj.price_distributor = p.distributorPrice;
      baseObj.price_distributor_with_ipi = p.distributorPriceWithIPI;
      baseObj.price_final = p.finalPrice;
      baseObj.price_final_with_ipi = p.finalPriceWithIPI;

      // Also include camelCase versions as fallback
      baseObj.priceDistributor = p.distributorPrice;
      baseObj.priceDistributorWithIPI = p.distributorPriceWithIPI;
      baseObj.priceFinal = p.finalPrice;
      baseObj.priceFinalWithIPI = p.finalPriceWithIPI;

      // For backwards compatibility with resale price
      baseObj.price_resale = p.finalPrice;
      baseObj.price_resale_with_ipi = p.finalPriceWithIPI;
      baseObj.priceResale = p.finalPrice;
      baseObj.priceResaleWithIPI = p.finalPriceWithIPI;

      return baseObj;
    });

    console.log("[importProducts] First product to insert:", JSON.stringify(transformedProducts[0], null, 2));

    // Insert products to Supabase
    const { error, data } = await supabase
      .from("products")
      .insert(transformedProducts);

    if (error) {
      console.error("Error importing products to Supabase:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to import products to database",
      });
    }

    res.json({
      success: true,
      message: `${uniqueProducts.length} product(s) imported successfully`,
      count: uniqueProducts.length,
    });
  } catch (error) {
    console.error("Error importing products:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to import products",
    });
  }
};

/**
 * Delete all products from Supabase
 */
export const deleteAllProducts: RequestHandler = async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: "Supabase not configured",
      });
    }

    // Get count before deleting
    const { count } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });

    // Delete all products
    const { error } = await supabase
      .from("products")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all by using a condition that matches everything

    if (error) {
      console.error("Error deleting products from Supabase:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to delete products from database",
      });
    }

    res.json({
      success: true,
      message: `${count || 0} product(s) deleted successfully`,
      deletedCount: count || 0,
    });
  } catch (error) {
    console.error("Error deleting products:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete products",
    });
  }
};
