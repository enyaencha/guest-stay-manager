import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RoomTypeConfig } from "@/types/settings";
import { BedDouble, Plus, Edit, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { formatKsh } from "@/lib/formatters";

interface RoomTypeSettingsProps {
  roomTypes: RoomTypeConfig[];
  onUpdate: (roomTypes: RoomTypeConfig[]) => void;
}

export const RoomTypeSettings = ({ roomTypes, onUpdate }: RoomTypeSettingsProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<RoomTypeConfig | null>(null);
  const [newAmenity, setNewAmenity] = useState("");
  const [formData, setFormData] = useState<Partial<RoomTypeConfig>>({
    name: "",
    basePrice: 0,
    maxOccupancy: 1,
    amenities: [],
    description: ""
  });

  const handleInputChange = (field: keyof RoomTypeConfig, value: string | number | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddAmenity = () => {
    if (newAmenity.trim() && !formData.amenities?.includes(newAmenity.trim())) {
      handleInputChange("amenities", [...(formData.amenities || []), newAmenity.trim()]);
      setNewAmenity("");
    }
  };

  const handleRemoveAmenity = (amenity: string) => {
    handleInputChange("amenities", (formData.amenities || []).filter(a => a !== amenity));
  };

  const handleAdd = () => {
    const newType: RoomTypeConfig = {
      id: `type-${Date.now()}`,
      name: formData.name || "",
      basePrice: Number(formData.basePrice) || 0,
      maxOccupancy: Number(formData.maxOccupancy) || 1,
      amenities: formData.amenities || [],
      description: formData.description || ""
    };
    onUpdate([...roomTypes, newType]);
    setIsAddDialogOpen(false);
    resetForm();
    toast.success("Room type added successfully");
  };

  const handleEdit = () => {
    if (!editingType) return;
    const updated = roomTypes.map(type =>
      type.id === editingType.id ? { ...type, ...formData } : type
    );
    onUpdate(updated);
    setEditingType(null);
    resetForm();
    toast.success("Room type updated successfully");
  };

  const handleDelete = (id: string) => {
    onUpdate(roomTypes.filter(type => type.id !== id));
    toast.success("Room type removed");
  };

  const resetForm = () => {
    setFormData({
      name: "",
      basePrice: 0,
      maxOccupancy: 1,
      amenities: [],
      description: ""
    });
    setNewAmenity("");
  };

  const openEditDialog = (type: RoomTypeConfig) => {
    setEditingType(type);
    setFormData(type);
  };

  const RoomTypeForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${isEdit ? 'edit' : 'add'}-name`}>Room Type Name</Label>
          <Input
            id={`${isEdit ? 'edit' : 'add'}-name`}
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="e.g., Deluxe Suite"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${isEdit ? 'edit' : 'add'}-price`}>Base Price (KSH)</Label>
          <Input
            id={`${isEdit ? 'edit' : 'add'}-price`}
            type="number"
            value={formData.basePrice}
            onChange={(e) => handleInputChange("basePrice", Number(e.target.value))}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${isEdit ? 'edit' : 'add'}-occupancy`}>Max Occupancy</Label>
        <Input
          id={`${isEdit ? 'edit' : 'add'}-occupancy`}
          type="number"
          min={1}
          max={10}
          value={formData.maxOccupancy}
          onChange={(e) => handleInputChange("maxOccupancy", Number(e.target.value))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${isEdit ? 'edit' : 'add'}-description`}>Description</Label>
        <Textarea
          id={`${isEdit ? 'edit' : 'add'}-description`}
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          rows={2}
        />
      </div>
      <div className="space-y-2">
        <Label>Amenities</Label>
        <div className="flex gap-2">
          <Input
            value={newAmenity}
            onChange={(e) => setNewAmenity(e.target.value)}
            placeholder="Add amenity"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAmenity())}
          />
          <Button type="button" variant="outline" onClick={handleAddAmenity}>Add</Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {formData.amenities?.map((amenity) => (
            <Badge key={amenity} variant="secondary" className="flex items-center gap-1">
              {amenity}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleRemoveAmenity(amenity)}
              />
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BedDouble className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Room Types & Pricing</CardTitle>
              <CardDescription>Configure room types, pricing, and amenities</CardDescription>
            </div>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Room Type
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Room Type</DialogTitle>
                <DialogDescription>Configure a new room type with pricing and amenities</DialogDescription>
              </DialogHeader>
              <RoomTypeForm />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAdd}>Add Room Type</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {roomTypes.map((type) => (
            <div
              key={type.id}
              className="p-4 border rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">{type.name}</h4>
                  <Badge variant="outline">Max {type.maxOccupancy} guests</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{type.description}</p>
                <div className="flex flex-wrap gap-1">
                  {type.amenities.slice(0, 5).map((amenity) => (
                    <Badge key={amenity} variant="secondary" className="text-xs">
                      {amenity}
                    </Badge>
                  ))}
                  {type.amenities.length > 5 && (
                    <Badge variant="secondary" className="text-xs">
                      +{type.amenities.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">{formatKsh(type.basePrice)}</p>
                  <p className="text-xs text-muted-foreground">per night</p>
                </div>
                <div className="flex gap-1">
                  <Dialog open={editingType?.id === type.id} onOpenChange={(open) => !open && setEditingType(null)}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(type)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Room Type</DialogTitle>
                        <DialogDescription>Update room type configuration</DialogDescription>
                      </DialogHeader>
                      <RoomTypeForm isEdit />
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingType(null)}>Cancel</Button>
                        <Button onClick={handleEdit}>Save Changes</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(type.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
