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
import { FinanceTransaction } from "@/types/finance";
import { formatKsh } from "@/lib/formatters";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";

interface TransactionHistoryTableProps {
  transactions: FinanceTransaction[];
}

const categoryLabels: Record<string, string> = {
  'room-booking': 'Room Booking',
  'pos-sale': 'POS Sale',
  'service-charge': 'Service Charge',
  'late-checkout': 'Late Checkout',
  'damage-fee': 'Damage Fee',
  'other-income': 'Other',
  'inventory-purchase': 'Inventory',
  'room-amenities': 'Room Amenities',
  'maintenance': 'Maintenance',
  'utilities': 'Utilities',
  'staff-salary': 'Salary',
  'supplies': 'Supplies',
  'marketing': 'Marketing',
  'other-expense': 'Other'
};

const statusStyles: Record<string, string> = {
  paid: 'bg-status-available/10 text-status-available border-status-available/20',
  pending: 'bg-status-checkout/10 text-status-checkout border-status-checkout/20',
  overdue: 'bg-status-maintenance/10 text-status-maintenance border-status-maintenance/20',
  cancelled: 'bg-muted text-muted-foreground border-muted'
};

export function TransactionHistoryTable({ transactions }: TransactionHistoryTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Transaction History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium text-sm">
                    {new Date(transaction.date).toLocaleDateString('en-KE', { 
                      day: 'numeric', 
                      month: 'short' 
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {transaction.type === 'income' ? (
                        <ArrowUpRight className="h-4 w-4 text-status-available" />
                      ) : (
                        <ArrowDownLeft className="h-4 w-4 text-status-maintenance" />
                      )}
                      <span className="capitalize text-sm">{transaction.type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {categoryLabels[transaction.category] || transaction.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm">
                    {transaction.description}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {transaction.reference || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={`capitalize text-xs ${statusStyles[transaction.paymentStatus]}`}
                    >
                      {transaction.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-right font-semibold ${
                    transaction.type === 'income' ? 'text-status-available' : 'text-status-maintenance'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatKsh(transaction.amount)}
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
