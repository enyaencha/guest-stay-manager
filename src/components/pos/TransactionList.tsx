import { Transaction } from "@/types/pos";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt, CreditCard, Banknote, Smartphone, DoorOpen, Building2 } from "lucide-react";
import { formatKsh } from "@/lib/formatters";

interface TransactionListProps {
  transactions: Transaction[];
}

const statusConfig: Record<Transaction["status"], { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-status-checkout/20 text-status-checkout" },
  completed: { label: "Completed", className: "bg-status-available/20 text-status-available" },
  refunded: { label: "Refunded", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground" },
};

const paymentIcons: Record<Transaction["paymentMethod"], React.ReactNode> = {
  card: <CreditCard className="h-4 w-4" />,
  withdraw: <Banknote className="h-4 w-4" />,
  mobile: <Smartphone className="h-4 w-4" />,
  mpesa: <Smartphone className="h-4 w-4" />,
  "room-charge": <DoorOpen className="h-4 w-4" />,
  "bank-transfer": <Building2 className="h-4 w-4" />,
};

export const TransactionList = ({ transactions }: TransactionListProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Recent Transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transactions.map((txn) => {
            const status = statusConfig[txn.status];
            return (
              <div 
                key={txn.id} 
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-background">
                    {paymentIcons[txn.paymentMethod]}
                  </div>
                  <div>
                    <p className="font-medium">{txn.guestName} - Room {txn.roomNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {txn.items.map(i => `${i.quantity}x ${i.name}`).join(", ")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatKsh(txn.total)}</p>
                  <Badge className={status.className}>{status.label}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
