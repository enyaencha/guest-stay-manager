import { useState } from "react";
import { useAuditLogs, AuditLog } from "@/hooks/useAuditLog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, User, UserCog, Shield, Search, Calendar } from "lucide-react";
import { format } from "date-fns";

const actionColors: Record<string, string> = {
  role_assigned: "bg-green-500/10 text-green-600 border-green-500/20",
  role_revoked: "bg-red-500/10 text-red-600 border-red-500/20",
  role_updated: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  staff_created: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  staff_updated: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  staff_deactivated: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  staff_activated: "bg-teal-500/10 text-teal-600 border-teal-500/20",
  user_linked: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  bulk_import: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
};

const entityIcons: Record<string, React.ReactNode> = {
  staff: <User className="h-4 w-4" />,
  user_role: <Shield className="h-4 w-4" />,
  role: <UserCog className="h-4 w-4" />,
};

export function AuditLogViewer() {
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: logs = [], isLoading } = useAuditLogs(
    filterType !== "all" ? filterType : undefined
  );

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(searchLower) ||
      log.entity_type.toLowerCase().includes(searchLower) ||
      JSON.stringify(log.new_values).toLowerCase().includes(searchLower) ||
      JSON.stringify(log.old_values).toLowerCase().includes(searchLower)
    );
  });

  const formatActionLabel = (action: string) => {
    return action
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getChangeDescription = (log: AuditLog) => {
    const { action, new_values, old_values, metadata } = log;
    
    switch (action) {
      case "role_assigned":
        return `Assigned role "${new_values?.role_name || 'Unknown'}" to ${metadata?.staff_name || 'user'}`;
      case "role_revoked":
        return `Revoked role "${old_values?.role_name || 'Unknown'}" from ${metadata?.staff_name || 'user'}`;
      case "role_updated":
        return `Updated role assignment for ${metadata?.staff_name || 'user'}`;
      case "staff_created":
        return `Created staff member "${new_values?.name || 'Unknown'}"`;
      case "staff_updated":
        return `Updated staff "${metadata?.staff_name || 'Unknown'}"`;
      case "staff_deactivated":
        return `Deactivated staff "${metadata?.staff_name || 'Unknown'}"`;
      case "staff_activated":
        return `Activated staff "${metadata?.staff_name || 'Unknown'}"`;
      case "user_linked":
        return `Linked user account to staff "${metadata?.staff_name || 'Unknown'}"`;
      case "bulk_import":
        return `Imported ${metadata?.count || 0} staff members`;
      default:
        return formatActionLabel(action);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Audit Log
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="staff">Staff Changes</SelectItem>
              <SelectItem value="user_role">Role Assignments</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <History className="h-8 w-8 mb-2" />
              <p>No audit logs found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    {entityIcons[log.entity_type] || <History className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={actionColors[log.action] || ""}
                      >
                        {formatActionLabel(log.action)}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(log.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{getChangeDescription(log)}</p>
                    {(log.old_values || log.new_values) && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {log.old_values && Object.keys(log.old_values).length > 0 && (
                          <div>
                            <span className="font-medium">Previous:</span>{" "}
                            {Object.entries(log.old_values)
                              .filter(([k]) => k !== "role_name")
                              .slice(0, 3)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(", ")}
                          </div>
                        )}
                        {log.new_values && Object.keys(log.new_values).length > 0 && (
                          <div>
                            <span className="font-medium">New:</span>{" "}
                            {Object.entries(log.new_values)
                              .filter(([k]) => k !== "role_name")
                              .slice(0, 3)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(", ")}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
