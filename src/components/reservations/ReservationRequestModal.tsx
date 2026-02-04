import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RoomTypeOption {
  id: string;
  name: string;
  code?: string | null;
}

interface ReservationRequestItem {
  roomType: string;
  packageName: string;
  roomsCount: number;
  guestsCount: number;
  checkIn: string;
  checkOut: string;
}

interface ReservationRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomTypes: RoomTypeOption[];
  onCreated?: () => void;
}

const blankItem: ReservationRequestItem = {
  roomType: "",
  packageName: "",
  roomsCount: 1,
  guestsCount: 1,
  checkIn: "",
  checkOut: "",
};

export function ReservationRequestModal({
  open,
  onOpenChange,
  roomTypes,
  onCreated,
}: ReservationRequestModalProps) {
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [source, setSource] = useState("Walk-in");
  const [specialRequests, setSpecialRequests] = useState("");
  const [items, setItems] = useState<ReservationRequestItem[]>([{ ...blankItem }]);
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setGuestName("");
    setGuestPhone("");
    setGuestEmail("");
    setSource("Walk-in");
    setSpecialRequests("");
    setItems([{ ...blankItem }]);
  };

  const handleAddItem = () => {
    setItems((prev) => [...prev, { ...blankItem }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, updates: Partial<ReservationRequestItem>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...updates } : item)));
  };

  const handleSubmit = async () => {
    if (!guestName.trim() || !guestPhone.trim()) {
      toast.error("Guest name and phone are required");
      return;
    }
    const validItems = items.filter(
      (item) => item.roomType && item.checkIn && item.checkOut && item.roomsCount > 0
    );
    if (validItems.length === 0) {
      toast.error("Add at least one reservation line");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        guest_name: guestName.trim(),
        guest_phone: guestPhone.trim(),
        guest_email: guestEmail.trim() || null,
        source,
        status: "pending",
        special_requests: specialRequests.trim() || null,
        request_items: validItems.map((item) => ({
          room_type: item.roomType,
          package: item.packageName || null,
          rooms_count: Number(item.roomsCount) || 1,
          guests_count: Number(item.guestsCount) || 1,
          check_in: item.checkIn,
          check_out: item.checkOut,
        })),
      };

      const { data, error } = await supabase
        .from("reservation_requests")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      await supabase.from("booking_notifications").insert({
        reservation_request_id: data.id,
        type: "new_reservation",
        title: "New Reservation Request",
        message: `${payload.guest_name} requested ${validItems.length} reservation${validItems.length > 1 ? "s" : ""}.`,
      });

      toast.success("Reservation request created");
      onCreated?.();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error("Reservation request error:", error);
      toast.error(error.message || "Failed to create reservation request");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Reservation Request</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Guest Name *</Label>
              <Input value={guestName} onChange={(e) => setGuestName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Phone *</Label>
              <Input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email (optional)</Label>
              <Input value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Source</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Walk-in">Walk-in</SelectItem>
                  <SelectItem value="Phone">Phone Call</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem value="Referral">Referral</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Reservation Lines</Label>
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="rounded-lg border p-4 space-y-3">
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                      <Label>Room Type *</Label>
                      <Select
                        value={item.roomType}
                        onValueChange={(value) => handleItemChange(index, { roomType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {roomTypes.map((type) => (
                            <SelectItem key={type.id} value={type.name}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Package (optional)</Label>
                      <Input
                        value={item.packageName}
                        onChange={(e) =>
                          handleItemChange(index, { packageName: e.target.value })
                        }
                        placeholder="Standard / Deluxe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Rooms *</Label>
                      <Input
                        type="number"
                        min={1}
                        value={item.roomsCount}
                        onChange={(e) =>
                          handleItemChange(index, { roomsCount: Number(e.target.value) })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Guests</Label>
                      <Input
                        type="number"
                        min={1}
                        value={item.guestsCount}
                        onChange={(e) =>
                          handleItemChange(index, { guestsCount: Number(e.target.value) })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Check-in *</Label>
                      <Input
                        type="datetime-local"
                        value={item.checkIn}
                        onChange={(e) => handleItemChange(index, { checkIn: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Check-out *</Label>
                      <Input
                        type="datetime-local"
                        value={item.checkOut}
                        onChange={(e) => handleItemChange(index, { checkOut: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" onClick={handleAddItem}>
              <Plus className="h-4 w-4 mr-2" />
              Add Reservation Line
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Special Requests (optional)</Label>
            <Textarea
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Request"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
