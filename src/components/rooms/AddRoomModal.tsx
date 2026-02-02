import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateRoom, useRoomTypes } from "@/hooks/useRooms";

interface AddRoomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddRoomModal({ open, onOpenChange }: AddRoomModalProps) {
  const { data: roomTypes = [] } = useRoomTypes();
  const createRoom = useCreateRoom();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    number: "",
    roomTypeId: "",
    name: "",
    floor: 1,
    maxOccupancy: 2,
    basePrice: 0,
    amenities: "",
  });

  const selectedRoomType = useMemo(
    () => roomTypes.find((type) => type.id === formData.roomTypeId),
    [roomTypes, formData.roomTypeId]
  );

  useEffect(() => {
    if (!selectedRoomType) return;
    setFormData((prev) => ({
      ...prev,
      name: selectedRoomType.name,
      maxOccupancy: selectedRoomType.max_occupancy,
      basePrice: Number(selectedRoomType.base_price),
      amenities: (selectedRoomType.amenities || []).join(", "),
    }));
  }, [selectedRoomType]);

  const resetForm = () => {
    setFormData({
      number: "",
      roomTypeId: "",
      name: "",
      floor: 1,
      maxOccupancy: 2,
      basePrice: 0,
      amenities: "",
    });
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onOpenChange(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.number || !formData.roomTypeId || !formData.name) return;

    setIsSubmitting(true);
    try {
      const amenities = formData.amenities
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      await createRoom.mutateAsync({
        number: formData.number,
        name: formData.name,
        room_type_id: formData.roomTypeId,
        floor: formData.floor,
        max_occupancy: formData.maxOccupancy,
        base_price: formData.basePrice,
        amenities,
        occupancy_status: "vacant",
        cleaning_status: "clean",
        maintenance_status: "none",
        is_active: true,
        current_guest_id: null,
        current_booking_id: null,
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to add room:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Room</DialogTitle>
          <DialogDescription>Create a new room and add it to inventory.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Room Number *</Label>
            <Input
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              placeholder="101"
            />
          </div>

          <div className="space-y-2">
            <Label>Room Type *</Label>
            <Select
              value={formData.roomTypeId}
              onValueChange={(value) => setFormData({ ...formData, roomTypeId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select room type" />
              </SelectTrigger>
              <SelectContent>
                {roomTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Room Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Deluxe Suite"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Floor</Label>
              <Input
                type="number"
                min={0}
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value, 10) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Occupancy</Label>
              <Input
                type="number"
                min={1}
                value={formData.maxOccupancy}
                onChange={(e) => setFormData({ ...formData, maxOccupancy: parseInt(e.target.value, 10) || 1 })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Base Price</Label>
            <Input
              type="number"
              min={0}
              value={formData.basePrice}
              onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="space-y-2">
            <Label>Amenities (comma separated)</Label>
            <Textarea
              value={formData.amenities}
              onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
              rows={3}
              placeholder="Wi-Fi, Balcony, Ocean view"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.number || !formData.roomTypeId || !formData.name || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Adding..." : "Add Room"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
