import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// Format price in Brazilian format (with comma for cents)
const formatPrice = (price: number): string => {
  return price.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

interface Product {
  code: string;
  description: string;
  price: number;
  priceWithIPI: number;
}

interface ProductSearchProps {
  products: Product[];
  onSelect: (product: Product) => void;
  placeholder?: string;
}

export default function ProductSearch({
  products,
  onSelect,
  placeholder = "Pesquisar por descrição ou código...",
}: ProductSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setFiltered([]);
      setIsOpen(false);
      return;
    }

    const q = query.toLowerCase();
    const results = products.filter(
      (p) =>
        p.code.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );

    setFiltered(results.slice(0, 10)); // Limit to 10 results
    setIsOpen(results.length > 0);
  }, [query, products]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (product: Product) => {
    onSelect(product);
    setQuery("");
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery("");
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(query.length > 0 && filtered.length > 0)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded transition"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto animate-fade-in">
          {filtered.map((product, index) => (
            <button
              key={`${product.code}-${product.description}-${index}`}
              onClick={() => handleSelect(product)}
              className="w-full px-4 py-3 text-left hover:bg-muted transition border-b border-border last:border-b-0 focus:outline-none focus:bg-muted"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-500 text-sm text-foreground truncate">
                    {product.code}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-600 text-sm text-primary">
                    R$ {formatPrice(product.price)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    c/ IPI: R$ {formatPrice(product.priceWithIPI)}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {query && filtered.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg p-4 text-center text-muted-foreground">
          Nenhum produto encontrado
        </div>
      )}
    </div>
  );
}
