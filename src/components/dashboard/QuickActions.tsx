import { 
  UserPlus, 
  BedDouble, 
  ClipboardCheck, 
  Receipt,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";

const actions = [
  { label: "New Check-in", icon: UserPlus, variant: "default" as const },
  { label: "Add Room", icon: BedDouble, variant: "outline" as const },
  { label: "Create Task", icon: ClipboardCheck, variant: "outline" as const },
  { label: "New Sale", icon: Receipt, variant: "outline" as const },
];

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Button
          key={action.label}
          variant={action.variant}
          size="sm"
          className="gap-2"
        >
          <action.icon className="h-4 w-4" />
          {action.label}
        </Button>
      ))}
    </div>
  );
}
