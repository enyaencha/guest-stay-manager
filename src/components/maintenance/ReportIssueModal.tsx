import { useMemo, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateMaintenanceIssue, useMaintenanceStaff } from "@/hooks/useMaintenance";
import { useRooms } from "@/hooks/useRooms";

interface ReportIssueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialRoomId?: string;
  onIssueCreated?: (roomId: string) => void;
}

const categories = [
  { value: "hvac", label: "HVAC" },
  { value: "plumbing", label: "Plumbing" },
  { value: "electrical", label: "Electrical" },
  { value: "appliance", label: "Appliance" },
  { value: "structural", label: "Structural" },
  { value: "furniture", label: "Furniture" },
  { value: "other", label: "Other" },
];

const priorities = [
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

export function ReportIssueModal({ open, onOpenChange, initialRoomId, onIssueCreated }: ReportIssueModalProps) {
  const { data: rooms = [] } = useRooms();
  const { data: staff = [] } = useMaintenanceStaff();
  const createIssue = useCreateMaintenanceIssue();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const getInitialForm = (roomId?: string) => ({
    roomId: roomId ?? "",
    title: "",
    description: "",
    category: "hvac",
    priority: "medium",
    assignedTo: "",
  });

  const [formData, setFormData] = useState(() => getInitialForm(initialRoomId));

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
  };

  useEffect(() => {
    if (open) {
      setFormData(getInitialForm(initialRoomId));
    }
  }, [open, initialRoomId]);

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onIssueCreated?.(selectedRoom.id);
      onOpenChange(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedRoom || !formData.title) return;
    setIsSubmitting(true);
    try {
      await createIssue.mutateAsync({
        room_id: selectedRoom.id,
        room_number: selectedRoom.number,
        room_name: selectedRoom.name,
        title: formData.title,
        description: formData.description || null,
        category: formData.category,
        priority: formData.priority,
        status: "open",
        assigned_to: selectedStaff?.id ?? null,
        assigned_to_name: selectedStaff?.name ?? null,
        reported_by: null,
        reported_at: new Date().toISOString(),
        resolved_at: null,
        resolution_notes: null,
        cost: 0,
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to report issue:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Report Maintenance Issue</DialogTitle>
          <DialogDescription>Log a new maintenance issue for a room.</DialogDescription>
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

          <div className="space-y-2">
            <Label>Title *</Label>
            <Input
              value={formData.title}
              onChange={(event) => setFormData({ ...formData, title: event.target.value })}
              placeholder="Leaking AC unit"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(event) => setFormData({ ...formData, description: event.target.value })}
              rows={3}
              placeholder="Describe the issue in detail"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
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
                <SelectValue placeholder="Assign technician (optional)" />
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

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleClose}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={!formData.roomId || !formData.title || isSubmitting}>
              {isSubmitting ? "Submitting..." : "Report Issue"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
