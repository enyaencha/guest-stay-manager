import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ForecastResult {
  forecast: { date: string; predicted: number; lower: number; upper: number }[];
  confidence: number;
  factors: string[];
  summary: string;
}

export interface InsightsResult {
  insights: { title: string; description: string; impact: string }[];
  metrics: Record<string, number>;
  trends: Array<string | { metric?: string; trend?: string; description?: string }>;
  summary: string;
}

export interface RecommendationsResult {
  recommendations: { title: string; description: string; impact: 'high' | 'medium' | 'low'; category: string }[];
  priorityActions: string[];
  summary: string;
}

export interface AnomalyResult {
  anomalies: { type: string; description: string; severity: 'high' | 'medium' | 'low'; date?: string }[];
  alerts: string[];
  summary: string;
}

interface AnalyticsData {
  revenueData?: { date: string; roomRevenue: number; posRevenue: number; total: number }[];
  occupancyData?: { date: string; occupancy: number; rooms: number }[];
  inventoryData?: { name: string; currentStock: number; minStock: number; purchasesIn: number; stockOut: number }[];
  expenseData?: { category: string; amount: number; isEtims: boolean }[];
  reviewData?: { rating: number; comment: string | null; created_at: string }[];
}

export const useAIAnalytics = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [insights, setInsights] = useState<InsightsResult | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationsResult | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyResult | null>(null);
  const { toast } = useToast();

  const analyzeData = async (
    type: 'forecast' | 'insights' | 'recommendations' | 'anomaly',
    data: AnalyticsData
  ) => {
    setIsLoading(true);
    
    try {
      const { data: result, error } = await supabase.functions.invoke('ai-analytics', {
        body: { type, data },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (result?.error) {
        throw new Error(result.error);
      }

      switch (type) {
        case 'forecast':
          setForecast(result as ForecastResult);
          break;
        case 'insights':
          setInsights(result as InsightsResult);
          break;
        case 'recommendations':
          setRecommendations(result as RecommendationsResult);
          break;
        case 'anomaly':
          setAnomalies(result as AnomalyResult);
          break;
      }

      toast({
        title: "Analysis Complete",
        description: `AI ${type} analysis generated successfully.`,
      });

      return result;
    } catch (error) {
      console.error('AI Analytics error:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to generate analysis",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    forecast,
    insights,
    recommendations,
    anomalies,
    analyzeData,
  };
};
