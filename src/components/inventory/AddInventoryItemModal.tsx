import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateInventoryItem, useCreateInventoryLot, useCreateInventoryTransaction } from "@/hooks/useInventory";

interface AddInventoryItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categories = [
  "amenities",
  "bathroom",
  "kitchen",
  "cleaning",
  "linen",
  "office",
  "other",
];

export function AddInventoryItemModal({ open, onOpenChange }: AddInventoryItemModalProps) {
  const createItem = useCreateInventoryItem();
  const createLot = useCreateInventoryLot();
  const createTx = useCreateInventoryTransaction();
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "amenities",
    sku: "",
    unit: "pieces",
    unitCost: 0,
    sellingPrice: 0,
    supplier: "",
    currentStock: 0,
    minStock: 10,
    maxStock: 100,
    lotBrand: "",
    lotBatch: "",
    lotExpiry: "",
  });

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setIsSaving(true);
    try {
      const item = await createItem.mutateAsync({
        name: form.name,
        brand: "Generic",
        category: form.category,
        sku: form.sku || null,
        current_stock: form.currentStock,
        min_stock: form.minStock,
        max_stock: form.maxStock,
        unit: form.unit,
        unit_cost: form.unitCost,
        selling_price: form.sellingPrice || null,
        supplier: form.supplier || null,
        last_restocked: form.currentStock > 0 ? new Date().toISOString().split("T")[0] : null,
        opening_stock: form.currentStock,
        purchases_in: form.currentStock,
        stock_out: 0,
        is_active: true,
      } as any);

      if (form.currentStock > 0) {
        const lot = await createLot.mutateAsync({
          inventory_item_id: item.id,
          brand: form.lotBrand?.trim() || "Generic",
          batch_code: form.lotBatch?.trim() || null,
          expiry_date: form.lotExpiry || null,
          quantity: form.currentStock,
          unit_cost: form.unitCost,
        });
        await createTx.mutateAsync({
          inventory_item_id: item.id,
          inventory_lot_id: lot.id,
          item_name: item.name,
          brand: lot.brand,
          transaction_type: "purchase",
          direction: "in",
          quantity: form.currentStock,
          unit: item.unit,
          unit_cost: item.unit_cost,
          total_value: item.unit_cost * form.currentStock,
          batch_code: form.lotBatch?.trim() || null,
          expiry_date: form.lotExpiry || null,
          transaction_date: new Date().toISOString().split("T")[0],
          reference: null,
          notes: "Opening stock",
        });
      }

      onOpenChange(false);
      setForm({
        name: "",
        category: "amenities",
        sku: "",
        unit: "pieces",
        unitCost: 0,
        sellingPrice: 0,
        supplier: "",
        currentStock: 0,
        minStock: 10,
        maxStock: 100,
        lotBrand: "",
        lotBatch: "",
        lotExpiry: "",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Inventory Item</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>SKU</Label>
              <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Supplier</Label>
              <Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Unit Cost</Label>
              <Input
                type="number"
                value={form.unitCost}
                onChange={(e) => setForm({ ...form, unitCost: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Selling Price</Label>
              <Input
                type="number"
                value={form.sellingPrice}
                onChange={(e) => setForm({ ...form, sellingPrice: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Opening Stock</Label>
              <Input
                type="number"
                value={form.currentStock}
                onChange={(e) => setForm({ ...form, currentStock: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Opening Brand</Label>
              <Input
                value={form.lotBrand}
                onChange={(e) => setForm({ ...form, lotBrand: e.target.value })}
                placeholder="Brand for opening stock"
                disabled={form.currentStock <= 0}
              />
            </div>
            <div className="space-y-2">
              <Label>Opening Batch</Label>
              <Input
                value={form.lotBatch}
                onChange={(e) => setForm({ ...form, lotBatch: e.target.value })}
                placeholder="Optional batch code"
                disabled={form.currentStock <= 0}
              />
            </div>
            <div className="space-y-2">
              <Label>Opening Expiry</Label>
              <Input
                type="date"
                value={form.lotExpiry}
                onChange={(e) => setForm({ ...form, lotExpiry: e.target.value })}
                disabled={form.currentStock <= 0}
              />
            </div>
            <div className="space-y-2">
              <Label>Min Stock</Label>
              <Input
                type="number"
                value={form.minStock}
                onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Stock</Label>
              <Input
                type="number"
                value={form.maxStock}
                onChange={(e) => setForm({ ...form, maxStock: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving || !form.name.trim()}>
              {isSaving ? "Saving..." : "Add Item"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
