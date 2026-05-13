import { useState } from "react";
import { ChevronDown } from "lucide-react";

// Format price in Brazilian format (with comma for cents)
const formatPrice = (price: number): string => {
  return price.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

interface BatchProductProps {
  code: string;
  description: string;
  marca: string;
  descriptor?: string | null;
  price: number;
  priceWithIPI: number;
  totalPrice: number;
  totalPriceWithIPI: number;
  distributorPrice?: number;
  finalPrice?: number;
  priceMultiplied?: number;
  totalPriceMultiplied?: number;
}

export default function BatchProduct({
  code,
  description,
  marca,
  descriptor,
  price,
  priceWithIPI,
  totalPrice,
  totalPriceWithIPI,
  distributorPrice = 0,
  finalPrice = 0,
  priceMultiplied = 0,
  totalPriceMultiplied = 0,
}: BatchProductProps) {
  const [expandedDescriptor, setExpandedDescriptor] = useState(false);

  return (
    <div className="border border-border rounded-lg p-4 hover:bg-muted/30 transition">
      {/* Header Row: Código, Marca e Preços */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3 pb-3 border-b border-border">
        <div>
          <p className="text-xs text-muted-foreground font-600">Código</p>
          <p className="text-lg font-bold text-primary">{code}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-600">Marca</p>
          <p className="font-600 text-sm">{marca}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-600">Distribuidor sem IPI</p>
          <p className="font-600 text-sm">R$ {formatPrice(distributorPrice ?? 0)}</p>
          <p className="text-xs text-muted-foreground font-600 mt-2">Distribuidor c/ IPI</p>
          <p className="font-600">R$ {formatPrice(price ?? 0)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-600">Final sem IPI</p>
          <p className="font-600 text-sm">R$ {formatPrice(finalPrice ?? 0)}</p>
          <p className="text-xs text-muted-foreground font-600 mt-2">Final c/ IPI</p>
          <p className="font-600">R$ {formatPrice(priceWithIPI ?? 0)}</p>
        </div>
      </div>

      {/* Descrição */}
      <div className="mb-3">
        <p className="text-xs text-muted-foreground font-600">Descrição</p>
        <p className="text-sm text-foreground whitespace-pre-wrap break-words">
          {description}
        </p>
      </div>

      {/* Descritivo - Expandable */}
      {descriptor && (
        <div className="mb-3">
          <button
            onClick={() => setExpandedDescriptor(!expandedDescriptor)}
            className="flex items-center gap-2 w-full p-3 bg-muted rounded hover:bg-muted/80 transition text-left"
          >
            <ChevronDown
              className={`w-4 h-4 flex-shrink-0 transition-transform ${
                expandedDescriptor ? "transform rotate-180" : ""
              }`}
            />
            <span className="text-xs text-muted-foreground font-600">
              Descritivo
            </span>
          </button>

          {expandedDescriptor && (
            <div className="p-3 bg-muted rounded mt-2 border border-border">
              <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                {descriptor}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Total */}
      <div className="flex justify-between items-center pt-3 border-t border-border">
        <span className="font-600 text-muted-foreground">Preço Total Distribuidor c/ IPI:</span>
        <span className="text-lg font-bold text-primary">
          R$ {formatPrice(totalPrice ?? 0)}
        </span>
      </div>
      <div className="flex justify-between items-center mt-1">
        <span className="text-sm text-muted-foreground">Preço Total Final c/ IPI:</span>
        <span className="font-600">
          R$ {formatPrice(totalPriceWithIPI ?? 0)}
        </span>
      </div>
      {priceMultiplied > 0 && (
        <div className="space-y-1 mt-2 pt-2 border-t border-border/50">
          <div className="flex justify-between items-center">
            <span className="text-sm font-600 text-accent">Preço Multiplicado (Unitário):</span>
            <span className="font-bold text-lg text-accent">
              R$ {formatPrice(priceMultiplied)}
            </span>
          </div>
          {totalPriceMultiplied > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-600 text-accent">Total Multiplicado:</span>
              <span className="font-bold text-lg text-accent">
                R$ {formatPrice(totalPriceMultiplied)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
