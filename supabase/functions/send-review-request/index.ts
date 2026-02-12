import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing authorization header" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      return jsonResponse({ error: "Supabase environment not configured" }, 500);
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      db: { schema: "public" },
    });
    const anonClient = createClient(supabaseUrl, supabaseAnonKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: authData, error: authError } = await anonClient.auth.getUser(token);

    if (authError || !authData?.user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const payload = await req.json();
    const bookingId = String(payload?.bookingId || "").trim();

    if (!bookingId) {
      return jsonResponse({ error: "bookingId is required" }, 400);
    }

    const { data: booking, error: bookingError } = await adminClient
      .from("bookings")
      .select("id, guest_id, room_number, check_in, check_out")
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingError || !booking) {
      return jsonResponse({ error: "Booking not found" }, 404);
    }

    const { data: guest } = await adminClient
      .from("guests")
      .select("id, name, phone, email")
      .eq("id", booking.guest_id)
      .maybeSingle();

    const { data: property } = await adminClient
      .from("property_settings")
      .select("name, phone, email")
      .maybeSingle();

    const { data: notificationSettings } = await adminClient
      .from("notification_settings")
      .select("email_notifications, sms_notifications, review_requests")
      .maybeSingle();

    const reviewRequestsEnabled = notificationSettings?.review_requests ?? true;
    const emailEnabled = notificationSettings?.email_notifications ?? true;
    const smsEnabled = notificationSettings?.sms_notifications ?? true;

    const channel = reviewRequestsEnabled && emailEnabled && guest?.email
      ? "email"
      : reviewRequestsEnabled && smsEnabled && guest?.phone
        ? "sms"
        : "manual";

    const { data: reviewRequest, error: requestError } = await adminClient
      .from("review_requests")
      .insert({
        booking_id: booking.id,
        guest_id: guest?.id || null,
        guest_name: guest?.name || "Guest",
        guest_phone: guest?.phone || null,
        guest_email: guest?.email || null,
        channel,
        status: "pending",
      })
      .select()
      .single();

    if (requestError || !reviewRequest) {
      return jsonResponse({ error: requestError?.message || "Failed to create review request" }, 400);
    }

    if (channel === "manual") {
      return jsonResponse({ status: "pending", channel, requestId: reviewRequest.id });
    }

    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    if (!brevoApiKey) {
      await adminClient
        .from("review_requests")
        .update({ status: "failed" })
        .eq("id", reviewRequest.id);
      return jsonResponse({ error: "Brevo API key not configured" }, 500);
    }

    const baseUrl =
      Deno.env.get("PUBLIC_SITE_URL") ||
      req.headers.get("origin") ||
      "http://localhost:8081";
    const reviewUrl = `${baseUrl.replace(/\/$/, "")}/?review=1&booking=${booking.id}`;
    const propertyName = property?.name || "STROS";

    let sendResponse: Response;

    if (channel === "email") {
      const fromEmail = Deno.env.get("BREVO_EMAIL_FROM") || property?.email || "";
      const fromName = Deno.env.get("BREVO_EMAIL_FROM_NAME") || propertyName;

      if (!fromEmail) {
        await adminClient
          .from("review_requests")
          .update({ status: "failed" })
          .eq("id", reviewRequest.id);
        return jsonResponse({ error: "Brevo sender email not configured" }, 500);
      }

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2 style="margin-bottom: 8px;">Thanks for staying with ${propertyName}</h2>
          <p>Hello ${guest?.name || "Guest"},</p>
          <p>We hope you enjoyed your stay in room ${booking.room_number}. Your feedback helps us improve.</p>
          <p><a href="${reviewUrl}" style="display:inline-block; padding:10px 16px; background:#1f6feb; color:#fff; text-decoration:none; border-radius:6px;">Leave a Review</a></p>
          <p>If the button doesn't work, copy and paste this link:</p>
          <p>${reviewUrl}</p>
          <p>Thank you,<br/>${propertyName}</p>
        </div>
      `;

      const textContent = `Hi ${guest?.name || "Guest"}, thanks for staying with ${propertyName} in room ${booking.room_number}. Please leave a review: ${reviewUrl}`;

      sendResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          accept: "application/json",
          "api-key": brevoApiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sender: { name: fromName, email: fromEmail },
          to: [{ email: guest?.email, name: guest?.name || "Guest" }],
          subject: `How was your stay at ${propertyName}?`,
          htmlContent,
          textContent,
        }),
      });
    } else {
      const smsSender = Deno.env.get("BREVO_SMS_SENDER") || propertyName.slice(0, 11);
      const smsPrefix = Deno.env.get("BREVO_SMS_ORG_PREFIX") || propertyName;
      const smsContent = `${propertyName}: Thanks for staying with us. Please share feedback: ${reviewUrl}`;

      sendResponse = await fetch("https://api.brevo.com/v3/transactionalSMS/send", {
        method: "POST",
        headers: {
          accept: "application/json",
          "api-key": brevoApiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sender: smsSender,
          recipient: guest?.phone,
          content: smsContent,
          type: "transactional",
          organisationPrefix: smsPrefix,
        }),
      });
    }

    if (!sendResponse.ok) {
      const errorText = await sendResponse.text();
      await adminClient
        .from("review_requests")
        .update({ status: "failed" })
        .eq("id", reviewRequest.id);
      return jsonResponse({ error: `Brevo API error: ${sendResponse.status}`, details: errorText }, 502);
    }

    await adminClient
      .from("review_requests")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", reviewRequest.id);

    return jsonResponse({ status: "sent", channel, requestId: reviewRequest.id });
  } catch (error) {
    console.error("send-review-request error:", error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Failed to send review request" },
      500
    );
  }
});
