import { useState, useEffect } from "react";
import { fetchAllProducts, Product } from "@/lib/supabase";

export function useSupabaseProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchAllProducts();
        setProducts(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro desconhecido";
        setError(message);
        console.error("Error loading products:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAllProducts();
      setProducts(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setError(message);
      console.error("Error refreshing products:", err);
    } finally {
      setLoading(false);
    }
  };

  return {
    products,
    loading,
    error,
    refresh,
  };
}
