import { createClient } from "npm:@supabase/supabase-js@2";

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

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      db: { schema: "public" },
    });
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
      return new Response(JSON.stringify({ error: "Only administrators can create users" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await req.json();
    const name = String(payload?.name || "").trim();
    const email = String(payload?.email || "").trim();
    const password = String(payload?.password || "").trim();
    const roleId = payload?.role_id ? String(payload.role_id) : null;

    if (!name || !email || !password) {
      return new Response(JSON.stringify({ error: "Name, email, and password are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!roleId) {
      return new Response(JSON.stringify({ error: "Role is required for new users" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });

    if (createError || !createData?.user) {
      return new Response(JSON.stringify({ error: createError?.message || "Failed to create user" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newUserId = createData.user.id;

    await adminClient
      .from("profiles")
      .upsert({
        user_id: newUserId,
        full_name: name,
        email,
        password_reset_required: true,
      });

    if (roleId) {
      await adminClient.from("user_roles").insert({
        user_id: newUserId,
        role_id: roleId,
        is_active: true,
      });
    }

    return new Response(JSON.stringify({ user_id: newUserId, email, name }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to create user" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
