import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const normalizeTrendPart = (value: unknown) => {
  if (typeof value === "string") {
    return value.trim();
  }
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
};

const formatTrendLabel = (trend: unknown) => {
  if (typeof trend === "string") {
    return trend;
  }

  if (trend && typeof trend === "object") {
    const trendObject = trend as Record<string, unknown>;
    const metric = normalizeTrendPart(trendObject.metric);
    const value = normalizeTrendPart(trendObject.trend);
    const combined = [metric, value].filter(Boolean).join(": ");

    if (combined) {
      return combined;
    }

    const description = normalizeTrendPart(trendObject.description);
    return description || "Trend";
  }

  return normalizeTrendPart(trend) || "Trend";
};

interface AnalyticsRequest {
  type: 'forecast' | 'insights' | 'recommendations' | 'anomaly';
  data: {
    revenueData?: Array<{ date: string; roomRevenue: number; posRevenue: number; total: number }>;
    occupancyData?: Array<{ date: string; occupancy: number; rooms: number }>;
    inventoryData?: Array<{ name: string; currentStock: number; minStock: number; purchasesIn: number; stockOut: number }>;
    expenseData?: Array<{ category: string; amount: number; isEtims: boolean }>;
    reviewData?: Array<{ rating: number; comment: string | null; created_at: string }>;
  };
  period?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, data, period } = await req.json() as AnalyticsRequest;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";
    const reviewSnippet = data.reviewData ? JSON.stringify(data.reviewData.slice(0, 50)) : "[]";

    switch (type) {
      case 'forecast':
        systemPrompt = `You are a hotel revenue forecasting AI. Analyze historical data and provide accurate revenue predictions. 
        Always respond in JSON format with: { "forecast": [...], "confidence": number, "factors": [...], "summary": string }`;
        userPrompt = `Based on this revenue data: ${JSON.stringify(data.revenueData)}, forecast the next 7 days of revenue. Consider seasonality and trends.`;
        break;
        
      case 'insights':
        systemPrompt = `You are a hotel business intelligence AI. Analyze operational data and provide actionable insights.
        Always respond in JSON format with: { "insights": [...], "metrics": {...}, "trends": [...], "summary": string }`;
        userPrompt = `Analyze this hotel data:
        Revenue: ${JSON.stringify(data.revenueData)}
        Occupancy: ${JSON.stringify(data.occupancyData)}
        Guest Reviews: ${reviewSnippet}
        Provide key business insights and performance metrics.`;
        break;
        
      case 'recommendations':
        systemPrompt = `You are a hotel operations optimization AI. Provide specific, actionable recommendations to improve profitability.
        Always respond in JSON format with: { "recommendations": [{ "title": string, "description": string, "impact": "high"|"medium"|"low", "category": string }], "priorityActions": [...], "summary": string }`;
        userPrompt = `Based on this data:
        Revenue: ${JSON.stringify(data.revenueData)}
        Inventory: ${JSON.stringify(data.inventoryData)}
        Expenses: ${JSON.stringify(data.expenseData)}
        Guest Reviews: ${reviewSnippet}
        Provide recommendations to improve hotel profitability and operations.`;
        break;
        
      case 'anomaly':
        systemPrompt = `You are a hotel anomaly detection AI. Identify unusual patterns, potential issues, and outliers in operational data.
        Always respond in JSON format with: { "anomalies": [{ "type": string, "description": string, "severity": "high"|"medium"|"low", "date": string }], "alerts": [...], "summary": string }`;
        userPrompt = `Detect anomalies in this hotel data:
        Revenue: ${JSON.stringify(data.revenueData)}
        Occupancy: ${JSON.stringify(data.occupancyData)}
        Inventory: ${JSON.stringify(data.inventoryData)}`;
        break;
        
      default:
        throw new Error("Invalid analysis type");
    }

    console.log(`Processing ${type} analytics request`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    
    // Try to parse JSON from response
    let parsedContent;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content;
      parsedContent = JSON.parse(jsonStr);
    } catch {
      parsedContent = { raw: content };
    }

    if (parsedContent && typeof parsedContent === "object" && Array.isArray(parsedContent.trends)) {
      const rawTrends = parsedContent.trends as unknown[];
      const nonStringTrends = rawTrends.filter((trend) => typeof trend !== "string");

      if (nonStringTrends.length > 0) {
        console.warn("AI analytics returned non-string trends, normalizing.", {
          count: nonStringTrends.length,
          sample: nonStringTrends.slice(0, 1),
        });
      }

      parsedContent = {
        ...parsedContent,
        trends: rawTrends.map(formatTrendLabel),
      };
    }

    console.log(`${type} analytics completed successfully`);

    return new Response(JSON.stringify(parsedContent), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Analytics error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
