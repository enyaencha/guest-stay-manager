import {
  UserPlus,
  BedDouble,
  ClipboardCheck,
  Receipt,
  Wrench,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const actions = [
  { key: "checkin", label: "New Check-in", icon: UserPlus, variant: "default" as const },
  { key: "add-room", label: "Add Room", icon: BedDouble, variant: "outline" as const },
  { key: "housekeeping", label: "Housekeeping", icon: ClipboardCheck, variant: "outline" as const },
  { key: "maintenance", label: "Maintenance", icon: Wrench, variant: "outline" as const },
  { key: "sale", label: "New Sale", icon: Receipt, variant: "outline" as const },
];

interface QuickActionsProps {
  onAddRoom?: () => void;
  onHousekeeping?: () => void;
  onMaintenance?: () => void;
  onNewSale?: () => void;
  onNewCheckIn?: () => void;
}

export function QuickActions({
  onAddRoom,
  onHousekeeping,
  onMaintenance,
  onNewSale,
  onNewCheckIn,
}: QuickActionsProps) {
  const handlers: Record<string, (() => void) | undefined> = {
    "add-room": onAddRoom,
    housekeeping: onHousekeeping,
    maintenance: onMaintenance,
    sale: onNewSale,
    checkin: onNewCheckIn,
  };

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Button
          key={action.key}
          variant={action.variant}
          size="sm"
          className="gap-2"
          onClick={handlers[action.key]}
        >
          <action.icon className="h-4 w-4" />
          {action.label}
        </Button>
      ))}
    </div>
  );
}
