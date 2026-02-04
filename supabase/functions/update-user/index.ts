import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
      return new Response(JSON.stringify({ error: "Only administrators can update users" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await req.json();
    const userId = String(payload?.user_id || "").trim();
    const fullName = payload?.full_name ? String(payload.full_name).trim() : null;
    const email = payload?.email ? String(payload.email).trim() : null;
    const roleId = payload?.role_id ? String(payload.role_id) : null;
    const staffId = payload?.staff_id ? String(payload.staff_id) : null;

    if (!userId) {
      return new Response(JSON.stringify({ error: "user_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update auth user metadata/email if provided
    if (email || fullName) {
      await adminClient.auth.admin.updateUserById(userId, {
        ...(email ? { email } : {}),
        ...(fullName ? { user_metadata: { full_name: fullName } } : {}),
      });
    }

    // Update profile record
    await adminClient.from("profiles").upsert({
      user_id: userId,
      full_name: fullName,
      email,
    });

    // Role handling (single active role)
    await adminClient.from("user_roles").update({ is_active: false }).eq("user_id", userId);
    if (roleId) {
      await adminClient
        .from("user_roles")
        .upsert(
          { user_id: userId, role_id: roleId, is_active: true },
          { onConflict: "user_id,role_id" }
        );
    }

    // Staff linkage
    if (staffId) {
      await adminClient.from("staff").update({ user_id: null }).eq("user_id", userId);
      await adminClient.from("staff").update({ user_id: userId }).eq("id", staffId);
    } else {
      await adminClient.from("staff").update({ user_id: null }).eq("user_id", userId);
    }

    return new Response(JSON.stringify({ user_id: userId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to update user" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
