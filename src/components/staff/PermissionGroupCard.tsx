import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PermissionDef, getGroupIcon } from "@/lib/permissions";

interface PermissionGroupCardProps {
  group: string;
  permissions: PermissionDef[];
  activePermissions: string[];
  onToggle: (key: string) => void;
  onToggleAll: () => void;
}

export const PermissionGroupCard = ({
  group,
  permissions,
  activePermissions,
  onToggle,
  onToggleAll,
}: PermissionGroupCardProps) => {
  const allEnabled = permissions.every((p) => activePermissions.includes(p.key));
  const someEnabled = permissions.some((p) => activePermissions.includes(p.key));
  const enabledCount = permissions.filter((p) => activePermissions.includes(p.key)).length;

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getGroupIcon(group)}</span>
          <span className="text-sm font-semibold">{group}</span>
          {someEnabled && (
            <Badge variant="secondary" className="text-[10px]">
              {enabledCount}/{permissions.length}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {allEnabled ? "All on" : "Toggle all"}
          </span>
          <Switch checked={allEnabled} onCheckedChange={onToggleAll} />
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {permissions.map((perm) => (
          <div
            key={perm.key}
            className="flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <Label className="text-xs font-medium cursor-pointer block">
                {perm.label}
              </Label>
              <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                {perm.description}
              </p>
            </div>
            <Switch
              checked={activePermissions.includes(perm.key)}
              onCheckedChange={() => onToggle(perm.key)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
