import { InventoryItem } from '@/types/inventory';
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
import { Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface InventoryTableProps {
  items: InventoryItem[];
  onAdjustStock?: (itemId: string, adjustment: number) => void;
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

export function InventoryTable({ items, onAdjustStock }: InventoryTableProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Item</TableHead>
            <TableHead>Brand</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Stock Level</TableHead>
            <TableHead>Unit Cost</TableHead>
            <TableHead>Last Restocked</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const level = getStockLevel(item);
            const levelConfig = stockLevelConfig[level];
            const stockPercent = Math.min((item.currentStock / item.maxStock) * 100, 100);

            return (
              <TableRow key={item.id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.supplier}</p>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {item.brand}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {categoryLabels[item.category]}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {item.sku}
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
                  Ksh {item.unitCost.toFixed(2)} / {item.unit.slice(0, -1) || item.unit}
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
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      onClick={() => onAdjustStock?.(item.id, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      onClick={() => onAdjustStock?.(item.id, 10)}
                    >
                      <Plus className="h-3 w-3" />
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
