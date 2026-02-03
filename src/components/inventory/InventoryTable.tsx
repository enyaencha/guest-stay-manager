import { InventoryItem } from '@/types/inventory';
import { InventoryLot } from '@/hooks/useInventory';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ClipboardEdit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface InventoryTableProps {
  items: InventoryItem[];
  lots: InventoryLot[];
  onOpenAdjustment?: (options: {
    itemId?: string;
    type?: "purchase" | "adjustment";
    direction?: "in" | "out";
  }) => void;
}

const stockLevelConfig = {
  'out-of-stock': { label: 'Out of Stock', className: 'bg-destructive/10 text-destructive' },
  low: { label: 'Low Stock', className: 'bg-status-maintenance/10 text-status-maintenance' },
  adequate: { label: 'Adequate', className: 'bg-status-available/10 text-status-available' },
  full: { label: 'Full', className: 'bg-primary/10 text-primary' },
};

const categoryLabels = {
  bathroom: 'Bathroom',
  bedroom: 'Bedroom',
  kitchen: 'Kitchen',
  cleaning: 'Cleaning',
  amenities: 'Amenities',
  maintenance: 'Maintenance',
};

const getStockLevel = (item: InventoryItem): 'out-of-stock' | 'low' | 'adequate' | 'full' => {
  if (item.currentStock === 0) return 'out-of-stock';
  if (item.currentStock < item.minStock) return 'low';
  if (item.currentStock >= item.maxStock * 0.8) return 'full';
  return 'adequate';
};

export function InventoryTable({ items, lots, onOpenAdjustment }: InventoryTableProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Item</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Lots</TableHead>
            <TableHead>Stock Level</TableHead>
            <TableHead>Pricing</TableHead>
            <TableHead>Last Restocked</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const level = getStockLevel(item);
            const levelConfig = stockLevelConfig[level];
            const stockPercent = Math.min((item.currentStock / item.maxStock) * 100, 100);
            const itemLots = lots.filter((lot) => lot.inventory_item_id === item.id);
            const lotCount = itemLots.length;
            const lotSummary = itemLots.slice(0, 2).map((lot) => lot.brand).join(", ");

            return (
              <TableRow key={item.id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.supplier}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {categoryLabels[item.category]}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {item.sku}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  <div className="text-xs">
                    {lotCount} lots
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {lotSummary || "No lots"}
                    {lotCount > 2 ? "…" : ""}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1 min-w-[140px]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">
                        {item.currentStock} / {item.maxStock} {item.unit}
                      </span>
                      <Badge className={cn('text-xs', levelConfig.className)}>
                        {levelConfig.label}
                      </Badge>
                    </div>
                    <Progress 
                      value={stockPercent} 
                      className={cn(
                        'h-1.5',
                        level === 'out-of-stock' && '[&>div]:bg-destructive',
                        level === 'low' && '[&>div]:bg-status-maintenance',
                        level === 'adequate' && '[&>div]:bg-status-available',
                        level === 'full' && '[&>div]:bg-primary'
                      )}
                    />
                    <p className="text-xs text-muted-foreground">
                      Min: {item.minStock} {item.unit}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  <div className="text-sm">
                    <div>Ksh {item.unitCost.toFixed(2)} / {item.unit}</div>
                    {item.sellingPrice ? (
                      <div className="text-xs text-muted-foreground">Sell: Ksh {item.sellingPrice.toFixed(2)}</div>
                    ) : (
                      <div className="text-xs text-muted-foreground">Sell: -</div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {item.lastRestocked 
                    ? format(new Date(item.lastRestocked), 'MMM d, yyyy')
                    : 'Never'
                  }
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7"
                      onClick={() =>
                        onOpenAdjustment?.({
                          itemId: item.id,
                          type: "purchase",
                          direction: "in",
                        })
                      }
                    >
                      Add Stock
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      onClick={() =>
                        onOpenAdjustment?.({
                          itemId: item.id,
                          type: "adjustment",
                          direction: "out",
                        })
                      }
                    >
                      <ClipboardEdit className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
