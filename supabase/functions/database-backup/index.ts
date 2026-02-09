import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Tables to backup (public schema)
const TABLES_TO_BACKUP = [
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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role for full access
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      db: { schema: "public" },
    });

    // Verify user is authenticated and has admin role
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Backup requested by user: ${user.id}`);

    const adminRoleNames = ["administrator", "Administrator", "admin", "Admin"];
    let hasAdminRole = false;
    for (const roleName of adminRoleNames) {
      const { data } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role_name: roleName,
      });
      if (data) {
        hasAdminRole = true;
        break;
      }
    }

    const { data: permissions } = await supabase.rpc("get_user_permissions", {
      _user_id: user.id,
    });
    const hasManagePermissions = Array.isArray(permissions)
      ? permissions.includes("settings.manage") || permissions.includes("staff.manage")
      : false;

    if (!hasAdminRole && !hasManagePermissions) {
      console.error("User does not have admin role or manage permissions");
      return new Response(
        JSON.stringify({ error: "Only administrators can perform backups" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Export all tables
    const backup: Record<string, unknown[]> = {};
    const errors: string[] = [];

    console.log(`Starting backup of ${TABLES_TO_BACKUP.length} tables...`);

    for (const tableName of TABLES_TO_BACKUP) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select("*")
          .limit(10000); // Safety limit

        if (error) {
          console.error(`Error backing up ${tableName}:`, error.message);
          errors.push(`${tableName}: ${error.message}`);
          backup[tableName] = [];
        } else {
          backup[tableName] = data || [];
          console.log(`✓ ${tableName}: ${data?.length || 0} rows`);
        }
      } catch (err) {
        console.error(`Exception backing up ${tableName}:`, err);
        errors.push(`${tableName}: ${err instanceof Error ? err.message : "Unknown error"}`);
        backup[tableName] = [];
      }
    }

    const backupData = {
      metadata: {
        created_at: new Date().toISOString(),
        created_by: user.id,
        tables_count: TABLES_TO_BACKUP.length,
        errors: errors.length > 0 ? errors : undefined,
      },
      data: backup,
    };

    console.log(`Backup complete. Total tables: ${TABLES_TO_BACKUP.length}, Errors: ${errors.length}`);

    return new Response(JSON.stringify(backupData, null, 2), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="backup-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (error) {
    console.error("Backup failed:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Backup failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
