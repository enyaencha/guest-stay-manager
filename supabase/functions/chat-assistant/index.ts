import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are the STROS Property Manager AI Assistant — a helpful, friendly hotel management system guide. Your role is to:

1. **Guide users** through the system's features: Dashboard, Rooms, Reservations, Guests, POS, Housekeeping, Maintenance, Inventory, Reports, Finance, Settings, Refunds, and Reviews.

2. **Explain workflows**:
   - Booking flow: Reservation request → Confirm → Check-in → Stay → Checkout → Assessment → Refund (if needed)
   - POS: Add items to cart → Select guest/room → Complete sale
   - Housekeeping: Create task → Assign staff → Complete → Record amenities used
   - Maintenance: Report issue → Assign → Resolve
   - Inventory: Track stock → Purchase orders → Stock adjustments → Low stock alerts
   - Finance: Track income/expenses, POS sales, room amenity costs, staff salaries

3. **Provide tips** on using the system effectively, like:
   - Setting up room types and pricing in Settings
   - Managing staff roles and permissions
   - Generating and exporting reports
   - Using AI insights for business decisions

4. **Answer questions** about permissions, roles (Admin, Manager, Front Desk, Housekeeping, Maintenance), and what each role can access.

5. **Troubleshoot** common issues users might encounter.

Keep responses concise, practical, and formatted with markdown for readability. Use bullet points and bold text for key information. The currency used is Kenyan Shillings (KSH).`;

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
          ...messages,
        ],
        temperature: 0.4,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Chat assistant error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
