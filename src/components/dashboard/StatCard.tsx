import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'accent' | 'success' | 'warning';
}

export function StatCard({ 
  title, 
  value, 
  subtitle,
  description, 
  icon: Icon, 
  trend,
  variant = 'default' 
}: StatCardProps) {
  const displaySubtitle = subtitle || description;
  const variantStyles = {
    default: 'bg-card',
    accent: 'bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20',
    success: 'bg-gradient-to-br from-status-available-bg to-card border-status-available/20',
    warning: 'bg-gradient-to-br from-status-cleaning-bg to-card border-status-cleaning/20',
  };

  const iconStyles = {
    default: 'bg-muted text-muted-foreground',
    accent: 'bg-accent/15 text-accent',
    success: 'bg-status-available/15 text-status-available',
    warning: 'bg-status-cleaning/15 text-status-cleaning',
  };

  return (
    <div className={cn(
      "rounded-xl border p-5 shadow-card hover:shadow-card-hover transition-all duration-200 animate-fade-in",
      variantStyles[variant]
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {displaySubtitle && (
            <p className="text-xs text-muted-foreground">{displaySubtitle}</p>
          )}
          {trend && (
            <p className={cn(
              "text-xs font-medium",
              trend.isPositive ? "text-status-available" : "text-destructive"
            )}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% vs last week
            </p>
          )}
        </div>
        <div className={cn(
          "p-2.5 rounded-lg",
          iconStyles[variant]
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
