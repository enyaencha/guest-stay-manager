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
  'withdraw': 'bg-status-available/10 text-status-available border-status-available/20',
  'Withdraw': 'bg-status-available/10 text-status-available border-status-available/20',
  'card': 'bg-primary/10 text-primary border-primary/20',
  'Card': 'bg-primary/10 text-primary border-primary/20',
  'mpesa': 'bg-status-checkout/10 text-status-checkout border-status-checkout/20',
  'M-Pesa': 'bg-status-checkout/10 text-status-checkout border-status-checkout/20',
  'room-charge': 'bg-status-occupied/10 text-status-occupied border-status-occupied/20',
  'Room Charge': 'bg-status-occupied/10 text-status-occupied border-status-occupied/20'
};

export function POSSalesTable({ sales }: POSSalesTableProps) {
  const totalSales = sales.reduce((sum, s) => sum + s.totalAmount, 0);

  if (sales.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">POS Sales History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">No POS sales recorded yet</p>
        </CardContent>
      </Card>
    );
  }

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
                <TableHead>Items</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Staff</TableHead>
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
                  <TableCell className="font-medium text-sm max-w-[200px] truncate">
                    {sale.items || '-'}
                  </TableCell>
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
                  <TableCell className="text-sm text-muted-foreground">
                    {sale.staffName || '-'}
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
