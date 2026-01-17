import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { POSSalesRecord } from "@/types/finance";
import { formatKsh } from "@/lib/formatters";

interface POSSalesTableProps {
  sales: POSSalesRecord[];
}

const paymentMethodStyles: Record<string, string> = {
  'Cash': 'bg-status-available/10 text-status-available border-status-available/20',
  'Card': 'bg-primary/10 text-primary border-primary/20',
  'M-Pesa': 'bg-status-checkout/10 text-status-checkout border-status-checkout/20',
  'Room Charge': 'bg-status-occupied/10 text-status-occupied border-status-occupied/20'
};

export function POSSalesTable({ sales }: POSSalesTableProps) {
  const totalSales = sales.reduce((sum, s) => sum + s.totalAmount, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">POS Sales History</CardTitle>
        <div className="text-sm">
          <span className="text-muted-foreground">Total: </span>
          <span className="font-bold text-status-available">{formatKsh(totalSales)}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Date</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-center">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Room</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium text-sm">
                    {new Date(sale.date).toLocaleDateString('en-KE', { 
                      day: 'numeric', 
                      month: 'short' 
                    })}
                  </TableCell>
                  <TableCell className="font-medium text-sm">{sale.itemName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {sale.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-sm">{sale.quantity}</TableCell>
                  <TableCell className="text-right text-sm">{formatKsh(sale.unitPrice)}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${paymentMethodStyles[sale.paymentMethod] || ''}`}
                    >
                      {sale.paymentMethod}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {sale.roomNumber || '-'}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-status-available">
                    {formatKsh(sale.totalAmount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
