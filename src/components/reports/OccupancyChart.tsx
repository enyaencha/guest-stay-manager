import { OccupancyData } from "@/types/report";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { BedDouble } from "lucide-react";

interface OccupancyChartProps {
  data: OccupancyData[];
}

export const OccupancyChart = ({ data }: OccupancyChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BedDouble className="h-5 w-5" />
          Occupancy Rate
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="date" className="text-xs" />
            <YAxis className="text-xs" domain={[0, 100]} unit="%" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "hsl(var(--card))", 
                borderColor: "hsl(var(--border))",
                borderRadius: "8px"
              }}
              formatter={(value: number) => [`${value}%`, "Occupancy"]}
            />
            <Bar dataKey="occupancy" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.occupancy >= 90 
                    ? "hsl(var(--status-available))" 
                    : entry.occupancy >= 70 
                      ? "hsl(var(--chart-2))" 
                      : "hsl(var(--status-checkout))"
                  } 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
