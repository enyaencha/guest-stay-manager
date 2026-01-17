import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CategoryBreakdown } from "@/types/finance";
import { formatKsh } from "@/lib/formatters";

interface CategoryBreakdownCardProps {
  title: string;
  data: CategoryBreakdown[];
  colorClass: string;
}

export function CategoryBreakdownCard({ title, data, colorClass }: CategoryBreakdownCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground">{item.category}</span>
              <span className="font-medium">{formatKsh(item.amount)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Progress 
                value={item.percentage} 
                className={`h-2 flex-1 ${colorClass}`}
              />
              <span className="text-xs text-muted-foreground w-10 text-right">
                {item.percentage}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {item.transactionCount} transaction{item.transactionCount !== 1 ? 's' : ''}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
