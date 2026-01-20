import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  Sparkles,
  RefreshCw 
} from "lucide-react";
import { 
  ForecastResult, 
  InsightsResult, 
  RecommendationsResult, 
  AnomalyResult 
} from "@/hooks/useAIAnalytics";

interface AIInsightsPanelProps {
  isLoading: boolean;
  insights: InsightsResult | null;
  recommendations: RecommendationsResult | null;
  anomalies: AnomalyResult | null;
  onRefresh: () => void;
}

const impactColors = {
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
};

const severityColors = {
  high: "bg-red-500",
  medium: "bg-yellow-500",
  low: "bg-blue-500",
};

export const AIInsightsPanel = ({
  isLoading,
  insights,
  recommendations,
  anomalies,
  onRefresh,
}: AIInsightsPanelProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Insights Section */}
      {insights && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI Business Insights
            </CardTitle>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{insights.summary}</p>
            <div className="space-y-3">
              {insights.insights?.slice(0, 5).map((insight, idx) => (
                <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-primary mt-1 shrink-0" />
                    <div>
                      <p className="font-medium">{insight.title}</p>
                      <p className="text-sm text-muted-foreground">{insight.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {insights.trends && insights.trends.length > 0 && (
              <div className="mt-4">
                <p className="font-medium mb-2">Key Trends:</p>
                <div className="flex flex-wrap gap-2">
                  {insights.trends.map((trend, idx) => (
                    <Badge key={idx} variant="secondary">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {trend}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recommendations Section */}
      {recommendations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{recommendations.summary}</p>
            <div className="space-y-3">
              {recommendations.recommendations?.slice(0, 5).map((rec, idx) => (
                <div key={idx} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{rec.title}</p>
                      <p className="text-sm text-muted-foreground">{rec.description}</p>
                    </div>
                    <Badge className={impactColors[rec.impact]}>
                      {rec.impact} impact
                    </Badge>
                  </div>
                  <Badge variant="outline" className="mt-2">
                    {rec.category}
                  </Badge>
                </div>
              ))}
            </div>
            {recommendations.priorityActions && recommendations.priorityActions.length > 0 && (
              <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                <p className="font-medium mb-2">Priority Actions:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {recommendations.priorityActions.map((action, idx) => (
                    <li key={idx}>{action}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Anomalies Section */}
      {anomalies && anomalies.anomalies && anomalies.anomalies.length > 0 && (
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Anomaly Detection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{anomalies.summary}</p>
            <div className="space-y-3">
              {anomalies.anomalies.map((anomaly, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 ${severityColors[anomaly.severity]}`} />
                  <div>
                    <p className="font-medium">{anomaly.type}</p>
                    <p className="text-sm text-muted-foreground">{anomaly.description}</p>
                    {anomaly.date && (
                      <p className="text-xs text-muted-foreground mt-1">Date: {anomaly.date}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!insights && !recommendations && !anomalies && (
        <Card>
          <CardContent className="py-12 text-center">
            <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Click "Generate AI Insights" to analyze your data with AI
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
