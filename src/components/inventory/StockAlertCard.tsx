import { StockAlert } from '@/types/inventory';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StockAlertCardProps {
  alert: StockAlert;
}

const categoryLabels = {
  bathroom: 'Bathroom',
  bedroom: 'Bedroom',
  kitchen: 'Kitchen',
  cleaning: 'Cleaning',
  amenities: 'Amenities',
  maintenance: 'Maintenance',
};

export function StockAlertCard({ alert }: StockAlertCardProps) {
  const isCritical = alert.level === 'critical';

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border',
        isCritical ? 'bg-destructive/5 border-destructive/20' : 'bg-status-maintenance/5 border-status-maintenance/20'
      )}
    >
      {isCritical ? (
        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
      ) : (
        <AlertTriangle className="h-5 w-5 text-status-maintenance flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{alert.itemName}</p>
        <p className="text-xs text-muted-foreground">
          {categoryLabels[alert.category]} · {alert.currentStock} left (min: {alert.minStock})
        </p>
      </div>
    </div>
  );
}
