import { CartItem, PaymentMethod } from "@/types/pos";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShoppingCart, Minus, Plus, Trash2, CreditCard, Banknote, Smartphone, DoorOpen } from "lucide-react";
import { useState } from "react";
import { formatKsh } from "@/lib/formatters";

interface RoomOption {
  roomNumber: string;
  guestName: string;
  guestId?: string;
  bookingId?: string;
  isCheckedIn: boolean;
}

interface CartPanelProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: (
    selection: { roomNumber?: string; guestId?: string; guestName?: string },
    paymentMethod: PaymentMethod
  ) => void;
  onClearCart: () => void;
  roomOptions: RoomOption[];
}

const TAX_RATE = 0.10;

export const CartPanel = ({ 
  items, 
  onUpdateQuantity, 
  onRemoveItem, 
  onCheckout,
  onClearCart,
  roomOptions
}: CartPanelProps) => {
  const [roomNumber, setRoomNumber] = useState<string>("walk-in");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;
  const selectedRoom =
    roomNumber === "walk-in" ? undefined : roomOptions.find((room) => room.roomNumber === roomNumber);

  const handleCheckout = () => {
    if (paymentMethod === "room-charge" && roomNumber === "walk-in") return;
    onCheckout(
      {
        roomNumber: roomNumber === "walk-in" ? undefined : roomNumber,
        guestId: selectedRoom?.guestId,
        guestName: selectedRoom?.guestName,
      },
      paymentMethod
    );
    setRoomNumber("walk-in");
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Cart ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p>Cart is empty</p>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-auto mb-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{formatKsh(item.price)} each</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-7 w-7"
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-7 w-7"
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-destructive"
                      onClick={() => onRemoveItem(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 border-t pt-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatKsh(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax (10%)</span>
                <span>{formatKsh(tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatKsh(total)}</span>
              </div>

              <div className="space-y-2">
                <Label>Room (optional)</Label>
                <Select value={roomNumber} onValueChange={setRoomNumber}>
                  <SelectTrigger>
                    <SelectValue placeholder="Walk-in / No room" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="walk-in">Walk-in / No room</SelectItem>
                    {roomOptions.map((room) => (
                      <SelectItem key={room.roomNumber} value={room.roomNumber}>
                        Room {room.roomNumber} • {room.guestName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedRoom && (
                  <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                    Guest: <span className="font-medium text-foreground">{selectedRoom.guestName}</span> •{" "}
                    {selectedRoom.isCheckedIn ? "Checked In" : "Not Checked In"}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Credit Card
                      </div>
                    </SelectItem>
                    <SelectItem value="withdraw">
                      <div className="flex items-center gap-2">
                        <Banknote className="h-4 w-4" />
                        Withdraw
                      </div>
                    </SelectItem>
                    <SelectItem value="mobile">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        Mobile Money
                      </div>
                    </SelectItem>
                    <SelectItem value="room-charge">
                      <div className="flex items-center gap-2">
                        <DoorOpen className="h-4 w-4" />
                        Charge to Room
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={onClearCart}>
                  Clear
                </Button>
                <Button
                  className="flex-1"
                  disabled={paymentMethod === "room-charge" && roomNumber === "walk-in"}
                  onClick={handleCheckout}
                >
                  Checkout
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
