import { useMemo, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InventoryItem, InventoryLot } from "@/hooks/useInventory";

interface InventoryAdjustmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: InventoryItem[];
  lots: InventoryLot[];
  initialItemId?: string | null;
  initialType?: "purchase" | "adjustment";
  initialDirection?: "in" | "out";
  onSubmit: (payload: {
    itemId: string;
    type: "purchase" | "adjustment";
    direction: "in" | "out";
    quantity: number;
    unitCost: number;
    lotId?: string | null;
    lotBrand?: string;
    batchCode?: string;
    expiryDate?: string;
    transactionDate: string;
    reference?: string;
    notes?: string;
  }) => void;
}

export function InventoryAdjustmentModal({
  open,
  onOpenChange,
  items,
  lots,
  initialItemId = null,
  initialType = "purchase",
  initialDirection = "in",
  onSubmit,
}: InventoryAdjustmentModalProps) {
  const [itemId, setItemId] = useState<string>(initialItemId || "");
  const [type, setType] = useState<"purchase" | "adjustment">("purchase");
  const [direction, setDirection] = useState<"in" | "out">("in");
  const [quantity, setQuantity] = useState(0);
  const [unitCost, setUnitCost] = useState(0);
  const [lotId, setLotId] = useState<string>("new");
  const [lotBrand, setLotBrand] = useState("");
  const [batchCode, setBatchCode] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 16));
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const selectedItem = useMemo(() => items.find((item) => item.id === itemId), [items, itemId]);
  const itemLots = useMemo(
    () => lots.filter((lot) => lot.inventory_item_id === itemId),
    [lots, itemId]
  );
  const selectedLot = useMemo(
    () => itemLots.find((lot) => lot.id === lotId),
    [itemLots, lotId]
  );

  useEffect(() => {
    if (!open) {
      setItemId(initialItemId || "");
      setQuantity(0);
      setUnitCost(0);
      setLotId("new");
      setLotBrand("");
      setBatchCode("");
      setExpiryDate("");
      setReference("");
      setNotes("");
      setType(initialType);
      setDirection(initialDirection);
      setTransactionDate(new Date().toISOString().slice(0, 16));
      return;
    }

    if (open && initialItemId) {
      setItemId(initialItemId);
    }

    if (open) {
      setType(initialType);
      setDirection(initialDirection);
    }
  }, [open, initialItemId, initialType, initialDirection]);

  useEffect(() => {
    if (selectedLot) {
      setUnitCost(selectedLot.unit_cost);
      setBatchCode(selectedLot.batch_code || "");
      setExpiryDate(selectedLot.expiry_date || "");
      setLotBrand(selectedLot.brand || "");
    } else if (selectedItem && unitCost === 0) {
      setUnitCost(selectedItem.unit_cost);
    }
  }, [selectedItem, selectedLot, unitCost]);

  useEffect(() => {
    if (!selectedLot) return;
    setLotId(selectedLot.id);
  }, [selectedLot]);

  useEffect(() => {
    if (lotId !== "new" && !selectedLot) {
      return;
    }
    if (lotId === "new") {
      setLotBrand("");
      setBatchCode("");
      setExpiryDate("");
    }
  }, [lotId, selectedLot]);

  const handleSubmit = () => {
    if (!itemId || quantity <= 0) return;
    onSubmit({
      itemId,
      type,
      direction,
      quantity,
      unitCost,
      lotId: lotId !== "new" ? lotId : null,
      lotBrand: lotId === "new" ? lotBrand || "Generic" : selectedLot?.brand,
      batchCode: batchCode || undefined,
      expiryDate: expiryDate || undefined,
      transactionDate: new Date(transactionDate).toISOString(),
      reference: reference || undefined,
      notes: notes || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Inventory Adjustment</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="space-y-2">
            <Label>Item</Label>
            <Select value={itemId} onValueChange={setItemId}>
              <SelectTrigger>
                <SelectValue placeholder="Select item" />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name} · {item.brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Add a new brand/batch under this item, or pick an existing lot.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Brand / Batch / Expiry</Label>
            <Select value={lotId} onValueChange={setLotId} disabled={!itemId}>
              <SelectTrigger>
                <SelectValue placeholder="Select lot" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New brand / batch</SelectItem>
                {itemLots.map((lot) => (
                  <SelectItem key={lot.id} value={lot.id}>
                    {lot.brand}
                    {lot.batch_code ? ` · ${lot.batch_code}` : ""} ·{" "}
                    {lot.expiry_date || "No expiry"} · Qty {lot.quantity}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(value) => setType(value as typeof type)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="purchase">Purchase</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Direction</Label>
              <Select value={direction} onValueChange={(value) => setDirection(value as typeof direction)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Stock In</SelectItem>
                  <SelectItem value="out">Stock Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Unit Cost</Label>
              <Input
                type="number"
                min={0}
                value={unitCost}
                onChange={(e) => setUnitCost(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>Brand</Label>
              <Input
                value={lotBrand}
                onChange={(e) => setLotBrand(e.target.value)}
                disabled={lotId !== "new"}
              />
            </div>
            <div className="space-y-2">
              <Label>Batch Code</Label>
              <Input
                value={batchCode}
                onChange={(e) => setBatchCode(e.target.value)}
                disabled={lotId !== "new"}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                disabled={lotId !== "new"}
              />
            </div>
            <div className="space-y-2">
              <Label>Transaction Date & Time</Label>
              <Input
                type="datetime-local"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>Reference</Label>
              <Input value={reference} onChange={(e) => setReference(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!itemId || quantity <= 0}>
              Save
            </Button>
          </div>

          {selectedItem && (
            <div className="rounded-md border bg-muted/30 p-2 text-xs text-muted-foreground">
              <div className="font-medium text-foreground">
                {selectedItem.name}
              </div>
              Current stock: {selectedItem.current_stock} {selectedItem.unit}
              {selectedLot && (
                <div>
                  Lot: {selectedLot.brand}
                  {selectedLot.batch_code ? ` · ${selectedLot.batch_code}` : ""} ·{" "}
                  {selectedLot.expiry_date || "No expiry"} · Qty {selectedLot.quantity}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
