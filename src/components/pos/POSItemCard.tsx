import { POSItem } from "@/hooks/usePOS";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { formatKsh } from "@/lib/formatters";

interface POSItemCardProps {
  item: POSItem;
  onAddToCart?: (item: POSItem) => void;
  stockQuantity?: number | null;
  lotCount?: number;
  brandLabel?: string;
}

const categoryLabels: Record<string, string> = {
  services: "Service",
  "food-beverage": "F&B",
  amenities: "Amenity",
  experiences: "Experience",
  packages: "Package",
  beverages: "Beverages",
  health: "Health",
};

export const POSItemCard = ({ item, onAddToCart, stockQuantity, lotCount, brandLabel }: POSItemCardProps) => {
  const resolvedStock = typeof stockQuantity === "number" ? stockQuantity : item.stock_quantity;
  const showStock = typeof resolvedStock === "number";

  return (
    <Card className={`hover:shadow-md transition-shadow ${!item.is_available ? "opacity-50" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-medium">{item.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
            {brandLabel && (
              <p className="text-xs text-muted-foreground mt-1">Brands: {brandLabel}</p>
            )}
            {showStock && (
              <p className={`text-xs mt-1 ${resolvedStock === 0 ? "text-destructive" : "text-muted-foreground"}`}>
                {resolvedStock === 0 ? "Out of stock" : `In stock: ${resolvedStock}`}
                {lotCount && lotCount > 1 ? ` · ${lotCount} lots` : ""}
              </p>
            )}
          </div>
          <Badge variant="secondary" className="shrink-0 ml-2">
            {categoryLabels[item.category] || item.category}
          </Badge>
        </div>
        <div className="flex items-center justify-between mt-4">
          <span className="text-lg font-bold text-primary">
            {item.price === 0 ? "Free" : formatKsh(item.price)}
          </span>
          {onAddToCart && (
            <Button 
              size="sm" 
              disabled={!item.is_available}
              onClick={() => onAddToCart(item)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
