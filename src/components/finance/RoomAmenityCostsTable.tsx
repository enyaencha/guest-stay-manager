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
import { RoomAmenityCost } from "@/types/finance";
import { formatKsh } from "@/lib/formatters";

interface RoomAmenityCostsTableProps {
  costs: RoomAmenityCost[];
}

export function RoomAmenityCostsTable({ costs }: RoomAmenityCostsTableProps) {
  const totalCosts = costs.reduce((sum, c) => sum + c.totalCost, 0);

  // Group by room
  const roomTotals = costs.reduce((acc, cost) => {
    acc[cost.roomNumber] = (acc[cost.roomNumber] || 0) + cost.totalCost;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Room Amenity Costs</CardTitle>
        <div className="text-sm">
          <span className="text-muted-foreground">Total: </span>
          <span className="font-bold text-status-maintenance">{formatKsh(totalCosts)}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Room Summary */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(roomTotals).map(([room, total]) => (
            <Badge key={room} variant="secondary" className="text-xs py-1">
              Room {room}: {formatKsh(total)}
            </Badge>
          ))}
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Date</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="text-center">Qty</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead>Restocked By</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costs.map((cost) => (
                <TableRow key={cost.id}>
                  <TableCell className="font-medium text-sm">
                    {new Date(cost.date).toLocaleDateString('en-KE', { 
                      day: 'numeric', 
                      month: 'short' 
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {cost.roomNumber}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-sm">{cost.itemName}</TableCell>
                  <TableCell className="text-center text-sm">{cost.quantity}</TableCell>
                  <TableCell className="text-right text-sm">{formatKsh(cost.unitCost)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {cost.restockedBy}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-status-maintenance">
                    {formatKsh(cost.totalCost)}
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
