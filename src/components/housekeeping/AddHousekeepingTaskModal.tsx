import { useMemo, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateHousekeepingTask, useHousekeepingStaff } from "@/hooks/useHousekeeping";
import { useInventoryItems, useInventoryLots } from "@/hooks/useInventory";
import { useRooms } from "@/hooks/useRooms";
import { Json } from "@/integrations/supabase/types";

interface AddHousekeepingTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialRoomId?: string;
  initialTaskType?: string;
  initialPriority?: string;
  onTaskCreated?: (roomId: string) => void;
}

const taskTypes = [
  { value: "daily-clean", label: "Daily Clean" },
  { value: "checkout-clean", label: "Checkout Clean" },
  { value: "deep-clean", label: "Deep Clean" },
  { value: "turndown", label: "Turndown" },
  { value: "inspection", label: "Inspection" },
];

const priorities = [
  { value: "normal", label: "Normal" },
  { value: "low", label: "Low" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export function AddHousekeepingTaskModal({
  open,
  onOpenChange,
  initialRoomId,
  initialTaskType,
  initialPriority,
  onTaskCreated,
}: AddHousekeepingTaskModalProps) {
  const { data: rooms = [] } = useRooms();
  const { data: staff = [] } = useHousekeepingStaff();
  const { data: inventoryItems = [] } = useInventoryItems();
  const { data: inventoryLots = [] } = useInventoryLots();
  const createTask = useCreateHousekeepingTask();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const getInitialForm = (roomId?: string) => ({
    roomId: roomId ?? "",
    taskType: initialTaskType ?? "daily-clean",
    priority: initialPriority ?? "normal",
    assignedTo: "",
    notes: "",
    restockNotes: "",
    estimatedMinutes: 30,
  });

  const [formData, setFormData] = useState(() => getInitialForm(initialRoomId));
  const [plannedAmenities, setPlannedAmenities] = useState<
    { id: string; name: string; brand?: string; lotId?: string; expiryDate?: string | null; unit: string; quantity: number }[]
  >([]);
  const [inventorySearch, setInventorySearch] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [selectedLotId, setSelectedLotId] = useState("auto");
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === formData.roomId),
    [rooms, formData.roomId]
  );
  const selectedStaff = useMemo(
    () => staff.find((member) => member.id === formData.assignedTo),
    [staff, formData.assignedTo]
  );

  const resetForm = () => {
    setFormData(getInitialForm(initialRoomId));
    setPlannedAmenities([]);
    setInventorySearch("");
    setSelectedItemId("");
    setSelectedLotId("auto");
    setSelectedQuantity(1);
  };

  useEffect(() => {
    if (open) {
      setFormData(getInitialForm(initialRoomId));
    }
  }, [open, initialRoomId, initialTaskType, initialPriority]);

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onTaskCreated?.(selectedRoom.id);
      onOpenChange(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedRoom) return;
    setIsSubmitting(true);
    try {
      await createTask.mutateAsync({
        room_id: selectedRoom.id,
        room_number: selectedRoom.number,
        room_name: selectedRoom.name,
        task_type: formData.taskType,
        priority: formData.priority,
        status: "pending",
        assigned_to: selectedStaff?.id ?? null,
        assigned_to_name: selectedStaff?.name ?? null,
        notes: formData.notes || null,
        amenities: plannedAmenities as unknown as Json,
        restock_notes: formData.restockNotes || null,
        actual_added: [] as unknown as Json,
        actual_added_notes: null,
        estimated_minutes: formData.estimatedMinutes,
        completed_at: null,
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredInventory = useMemo(() => {
    const query = inventorySearch.trim().toLowerCase();
    if (!query) return inventoryItems;
    return inventoryItems.filter((item) => item.name.toLowerCase().includes(query));
  }, [inventoryItems, inventorySearch]);

  const selectedInventoryItem = useMemo(
    () => inventoryItems.find((item) => item.id === selectedItemId),
    [inventoryItems, selectedItemId]
  );
  const selectedLots = useMemo(
    () => inventoryLots.filter((lot) => lot.inventory_item_id === selectedItemId),
    [inventoryLots, selectedItemId]
  );

  const handleAddAmenity = () => {
    if (!selectedInventoryItem) return;
    const quantity = Math.max(selectedQuantity, 1);
    const selectedLot =
      selectedLotId !== "auto"
        ? selectedLots.find((lot) => lot.id === selectedLotId)
        : null;
    setPlannedAmenities((prev) => {
      const existing = prev.find((amenity) => amenity.id === selectedInventoryItem.id);
      if (existing) {
        return prev.map((amenity) =>
          amenity.id === selectedInventoryItem.id
            ? { ...amenity, quantity: amenity.quantity + quantity }
            : amenity
        );
      }
      return [
        ...prev,
        {
          id: selectedInventoryItem.id,
          name: selectedInventoryItem.name,
          brand: selectedLot?.brand,
          lotId: selectedLot?.id,
          expiryDate: selectedLot?.expiry_date || null,
          unit: selectedInventoryItem.unit,
          quantity,
        },
      ];
    });
    setSelectedItemId("");
    setSelectedLotId("auto");
    setSelectedQuantity(1);
  };

  const handleUpdateAmenityQuantity = (id: string, value: string) => {
    const quantity = Math.max(parseInt(value, 10) || 0, 0);
    setPlannedAmenities((prev) =>
      prev.map((amenity) => (amenity.id === id ? { ...amenity, quantity } : amenity))
    );
  };

  const handleRemoveAmenity = (id: string) => {
    setPlannedAmenities((prev) => prev.filter((amenity) => amenity.id !== id));
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Housekeeping Task</DialogTitle>
          <DialogDescription>Create and assign a housekeeping task.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Room *</Label>
            <Select value={formData.roomId} onValueChange={(value) => setFormData({ ...formData, roomId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a room" />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    Room {room.number} · {room.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Task Type</Label>
              <Select value={formData.taskType} onValueChange={(value) => setFormData({ ...formData, taskType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {taskTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Assign To</Label>
            <Select value={formData.assignedTo} onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Assign staff (optional)" />
              </SelectTrigger>
              <SelectContent>
                {staff.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Estimated Minutes</Label>
              <Input
                type="number"
                min={5}
                value={formData.estimatedMinutes}
                onChange={(event) => setFormData({ ...formData, estimatedMinutes: parseInt(event.target.value, 10) || 5 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Planned Amenities</Label>
              <Input
                value={inventorySearch}
                onChange={(event) => setInventorySearch(event.target.value)}
                placeholder="Search inventory items"
              />
            </div>
          </div>

          <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_100px_110px] gap-3">
              <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  {filteredInventory.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} · {item.unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedLotId} onValueChange={setSelectedLotId} disabled={!selectedItemId}>
                <SelectTrigger>
                  <SelectValue placeholder="Auto (earliest expiry)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto (earliest expiry)</SelectItem>
                  {selectedLots.map((lot) => (
                    <SelectItem key={lot.id} value={lot.id}>
                      {lot.brand}
                      {lot.batch_code ? ` · ${lot.batch_code}` : ""} · {lot.expiry_date || "No expiry"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                min={1}
                value={selectedQuantity}
                onChange={(event) => setSelectedQuantity(parseInt(event.target.value, 10) || 1)}
                placeholder="Qty"
              />
              <Button type="button" variant="outline" onClick={handleAddAmenity} disabled={!selectedItemId}>
                Add Item
              </Button>
            </div>

            {plannedAmenities.length > 0 ? (
              <div className="space-y-2">
                {plannedAmenities.map((amenity) => (
                  <div
                    key={amenity.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-md bg-background p-2"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {amenity.name}
                        {amenity.brand ? ` · ${amenity.brand}` : ""}
                        {amenity.expiryDate ? ` · exp ${amenity.expiryDate}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">{amenity.unit}</p>
                    </div>
                    <Input
                      type="number"
                      min={0}
                      className="w-24"
                      value={amenity.quantity}
                      onChange={(event) => handleUpdateAmenityQuantity(amenity.id, event.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => handleRemoveAmenity(amenity.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No amenities selected yet.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(event) => setFormData({ ...formData, notes: event.target.value })}
              rows={3}
              placeholder="Additional details for the team"
            />
          </div>

          <div className="space-y-2">
            <Label>Restock Notes</Label>
            <Textarea
              value={formData.restockNotes}
              onChange={(event) => setFormData({ ...formData, restockNotes: event.target.value })}
              rows={2}
              placeholder="Items to restock (optional)"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleClose}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={!formData.roomId || isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
