import { InventoryTransaction } from "@/hooks/useInventory";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface InventoryTransactionsTableProps {
  transactions: InventoryTransaction[];
}

const typeLabels: Record<string, string> = {
  purchase: "Purchase",
  sale: "Sale",
  "room-use": "Room Use",
  adjustment: "Adjustment",
  transfer: "Transfer",
  maintenance: "Maintenance",
};

export function InventoryTransactionsTable({ transactions }: InventoryTransactionsTableProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Date</TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Direction</TableHead>
            <TableHead className="text-right">Qty</TableHead>
            <TableHead className="text-right">Unit Cost</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Batch</TableHead>
            <TableHead>Expiry</TableHead>
            <TableHead>Reference</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((txn) => (
            <TableRow key={txn.id}>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(txn.created_at).toLocaleString()}
              </TableCell>
              <TableCell>
                <div className="text-sm font-medium">
                  {txn.item_name}
                </div>
                <div className="text-xs text-muted-foreground">{txn.brand}</div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {typeLabels[txn.transaction_type] || txn.transaction_type}
                </Badge>
              </TableCell>
              <TableCell className="text-sm capitalize">{txn.direction}</TableCell>
              <TableCell className="text-right">{txn.quantity}</TableCell>
              <TableCell className="text-right">Ksh {txn.unit_cost}</TableCell>
              <TableCell className="text-right">Ksh {txn.total_value}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{txn.batch_code || "-"}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{txn.expiry_date || "-"}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{txn.reference || "-"}</TableCell>
            </TableRow>
          ))}
          {transactions.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-6">
                No inventory transactions yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
