import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, RefreshCw } from "lucide-react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  Area,
  ComposedChart
} from "recharts";
import { formatKsh } from "@/lib/formatters";
import { ForecastResult } from "@/hooks/useAIAnalytics";

interface ForecastChartProps {
  forecast: ForecastResult | null;
  historicalData: { date: string; total: number }[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const ForecastChart = ({ 
  forecast, 
  historicalData, 
  isLoading, 
  onRefresh 
}: ForecastChartProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Combine historical and forecast data
  const chartData = [
    ...historicalData.map(d => ({
      date: d.date,
      actual: d.total,
      predicted: null,
      lower: null,
      upper: null,
    })),
    ...(forecast?.forecast || []).map(f => ({
      date: f.date,
      actual: null,
      predicted: f.predicted,
      lower: f.lower,
      upper: f.upper,
    })),
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            AI Revenue Forecast
          </CardTitle>
          {forecast && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">
                Confidence: {forecast.confidence}%
              </Badge>
            </div>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {forecast ? (
          <>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip 
                    formatter={(value: number) => formatKsh(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="upper"
                    stackId="1"
                    stroke="none"
                    fill="hsl(var(--primary) / 0.1)"
                    name="Upper Bound"
                  />
                  <Area
                    type="monotone"
                    dataKey="lower"
                    stackId="2"
                    stroke="none"
                    fill="hsl(var(--background))"
                    name="Lower Bound"
                  />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Actual"
                  />
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 4 }}
                    name="Predicted"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-2">Forecast Summary:</p>
              <p className="text-sm text-muted-foreground">{forecast.summary}</p>
              {forecast.factors && forecast.factors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium">Key Factors:</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {forecast.factors.map((factor, idx) => (
                      <Badge key={idx} variant="secondary">{factor}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Click "Generate Forecast" to get AI-powered revenue predictions
          </div>
        )}
      </CardContent>
    </Card>
  );
};
