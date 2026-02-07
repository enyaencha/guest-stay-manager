import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_TABLES = [
  "audit_logs",
  "booking_notifications",
  "bookings",
  "expenses",
  "finance_transactions",
  "guest_issues",
  "guests",
  "housekeeping_staff",
  "housekeeping_tasks",
  "inventory_items",
  "maintenance_issues",
  "maintenance_staff",
  "notification_settings",
  "pos_items",
  "pos_transactions",
  "profiles",
  "property_settings",
  "refund_requests",
  "reviews",
  "roles",
  "room_assessments",
  "room_supplies",
  "room_types",
  "rooms",
  "staff",
  "staff_secrets",
  "system_preferences",
  "user_roles",
];

const TRUNCATE_ORDER = [
  "audit_logs",
  "booking_notifications",
  "refund_requests",
  "room_assessments",
  "guest_issues",
  "pos_transactions",
  "pos_items",
  "inventory_items",
  "housekeeping_tasks",
  "housekeeping_staff",
  "maintenance_issues",
  "maintenance_staff",
  "bookings",
  "rooms",
  "room_supplies",
  "room_types",
  "guests",
  "staff",
  "user_roles",
  "roles",
  "profiles",
  "property_settings",
  "notification_settings",
  "system_preferences",
  "staff_secrets",
  "reviews",
  "finance_transactions",
  "expenses",
];

const INSERT_ORDER = [
  "profiles",
  "roles",
  "user_roles",
  "staff",
  "staff_secrets",
  "property_settings",
  "notification_settings",
  "system_preferences",
  "guests",
  "room_types",
  "rooms",
  "room_supplies",
  "bookings",
  "housekeeping_staff",
  "housekeeping_tasks",
  "maintenance_staff",
  "maintenance_issues",
  "inventory_items",
  "pos_items",
  "pos_transactions",
  "room_assessments",
  "guest_issues",
  "refund_requests",
  "booking_notifications",
  "reviews",
  "finance_transactions",
  "expenses",
  "audit_logs",
];

const chunk = <T>(arr: T[], size = 500) => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      return new Response(JSON.stringify({ error: "Supabase environment not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const anonClient = createClient(supabaseUrl, supabaseAnonKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminRoleNames = ["administrator", "Administrator", "admin", "Admin"];
    let hasAdminRole = false;
    for (const roleName of adminRoleNames) {
      const { data } = await adminClient.rpc("has_role", {
        _user_id: user.id,
        _role_name: roleName,
      });
      if (data) {
        hasAdminRole = true;
        break;
      }
    }
    const { data: permissions } = await adminClient.rpc("get_user_permissions", {
      _user_id: user.id,
    });
    const hasManagePermissions = Array.isArray(permissions)
      ? permissions.includes("settings.manage") || permissions.includes("staff.manage")
      : false;

    if (!hasAdminRole && !hasManagePermissions) {
      return new Response(JSON.stringify({ error: "Only administrators can restore backups" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await req.json();
    const rawData = payload?.data ?? payload;
    const tables = payload?.tables ?? DEFAULT_TABLES;
    const shouldTruncate = payload?.truncate !== false;

    if (!rawData || typeof rawData !== "object") {
      return new Response(JSON.stringify({ error: "Invalid backup payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dataByTable: Record<string, unknown[]> = rawData.data ?? rawData;

    if (shouldTruncate) {
      for (const table of TRUNCATE_ORDER) {
        if (!tables.includes(table)) continue;
        await adminClient.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
      }
    }

    const inserted: Record<string, number> = {};

    for (const table of INSERT_ORDER) {
      if (!tables.includes(table)) continue;
      const rows = dataByTable[table];
      if (!rows || rows.length === 0) {
        inserted[table] = 0;
        continue;
      }
      const batches = chunk(rows, 500);
      let total = 0;
      for (const batch of batches) {
        const { error } = await adminClient.from(table).insert(batch);
        if (error) {
          return new Response(JSON.stringify({ error: `Insert failed for ${table}: ${error.message}` }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        total += batch.length;
      }
      inserted[table] = total;
    }

    return new Response(JSON.stringify({ restored: inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Restore failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
