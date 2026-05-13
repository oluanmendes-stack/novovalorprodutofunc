import { useState, useEffect } from "react";
import { toast } from "sonner";
import { fetchAllProducts, searchProductByCode, fetchProductsByCode, type Product as SupabaseProduct } from "@/lib/supabase";

export interface Product {
  code: string;
  description: string;
  price: number;
  priceWithIPI: number;
  manufacturer?: string;
  distributorPrice?: number;
  distributorPriceWithIPI?: number;
  finalPrice?: number;
  finalPriceWithIPI?: number;
}

// Type helper for accessing price fields
export type ProductWithAllPrices = Product & {
  distributorPrice: number;
  distributorPriceWithIPI: number;
  finalPrice: number;
  finalPriceWithIPI: number;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const supabaseProducts = await fetchAllProducts();

        const productsWithManufacturer = supabaseProducts.map(
          (p: any) => ({
            code: p.code,
            description: p.description,
            price: p.priceDistributorWithIPI || p.price_distributor_with_ipi || 0,
            priceWithIPI: p.priceFinalWithIPI || p.price_final_with_ipi || 0,
            manufacturer: p.code.split("-")[0] || "Geral",
            distributorPrice: p.priceDistributor || p.price_distributor || 0,
            distributorPriceWithIPI: p.priceDistributorWithIPI || p.price_distributor_with_ipi || 0,
            finalPrice: p.priceFinal || p.price_final || 0,
            finalPriceWithIPI: p.priceFinalWithIPI || p.price_final_with_ipi || 0,
          })
        );
        setProducts(productsWithManufacturer);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const searchProducts = async (query: string) => {
    if (!query.trim()) return [];

    try {
      const allProducts = await fetchAllProducts();
      const queryLower = query.toLowerCase();

      return allProducts
        .filter((p) =>
          p.code.toLowerCase().includes(queryLower) ||
          p.description.toLowerCase().includes(queryLower)
        )
        .map((p: any) => ({
          code: p.code,
          description: p.description,
          price: p.priceDistributorWithIPI || p.price_distributor_with_ipi || 0,
          priceWithIPI: p.priceFinalWithIPI || p.price_final_with_ipi || 0,
          manufacturer: p.code.split("-")[0] || "Geral",
          distributorPrice: p.priceDistributor || p.price_distributor || 0,
          distributorPriceWithIPI: p.priceDistributorWithIPI || p.price_distributor_with_ipi || 0,
          finalPrice: p.priceFinal || p.price_final || 0,
          finalPriceWithIPI: p.priceFinalWithIPI || p.price_final_with_ipi || 0,
        }));
    } catch (error) {
      console.error("Error searching products:", error);
      return [];
    }
  };

  const getProductByCode = async (code: string) => {
    try {
      const product = await searchProductByCode(code);

      if (product) {
        const p = product as any;
        return {
          code: p.code,
          description: p.description,
          price: p.priceDistributorWithIPI || p.price_distributor_with_ipi || 0,
          priceWithIPI: p.priceFinalWithIPI || p.price_final_with_ipi || 0,
          manufacturer: p.code.split("-")[0] || "Geral",
          distributorPrice: p.priceDistributor || p.price_distributor || 0,
          distributorPriceWithIPI: p.priceDistributorWithIPI || p.price_distributor_with_ipi || 0,
          finalPrice: p.priceFinal || p.price_final || 0,
          finalPriceWithIPI: p.priceFinalWithIPI || p.price_final_with_ipi || 0,
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching product:", error);
      return null;
    }
  };

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabaseProducts = await fetchAllProducts();

      const productsWithManufacturer = supabaseProducts.map(
        (p: any) => ({
          code: p.code,
          description: p.description,
          price: p.priceDistributorWithIPI || p.price_distributor_with_ipi || 0,
          priceWithIPI: p.priceFinalWithIPI || p.price_final_with_ipi || 0,
          manufacturer: p.code.split("-")[0] || "Geral",
          distributorPrice: p.priceDistributor || p.price_distributor || 0,
          distributorPriceWithIPI: p.priceDistributorWithIPI || p.price_distributor_with_ipi || 0,
          finalPrice: p.priceFinal || p.price_final || 0,
          finalPriceWithIPI: p.priceFinalWithIPI || p.price_final_with_ipi || 0,
        })
      );
      setProducts(productsWithManufacturer);
      setError(null);
      toast.success("Dados atualizados com sucesso!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      console.error("Error refetching products:", err);
      toast.error(`Erro ao atualizar produtos: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return {
    products,
    loading,
    error,
    searchProducts,
    getProductByCode,
    refetch,
  };
}
