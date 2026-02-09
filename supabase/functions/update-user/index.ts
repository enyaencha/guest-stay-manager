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
      const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(userId, {
        ...(email ? { email } : {}),
        ...(fullName ? { user_metadata: { full_name: fullName } } : {}),
      });
      if (authUpdateError) {
        console.error("Auth update error:", authUpdateError.message);
      }
    }

    // Update profile record - only update fields that are provided
    const profileUpdates: Record<string, unknown> = {};
    if (fullName !== null) profileUpdates.full_name = fullName;
    if (email !== null) profileUpdates.email = email;

    if (Object.keys(profileUpdates).length > 0) {
      // First check if profile exists
      const { data: existingProfile } = await adminClient
        .from("profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existingProfile) {
        // Update existing profile
        const { error: profileError } = await adminClient
          .from("profiles")
          .update(profileUpdates)
          .eq("user_id", userId);
        if (profileError) {
          console.error("Profile update error:", profileError.message);
        }
      } else {
        // Insert new profile
        const { error: profileError } = await adminClient
          .from("profiles")
          .insert({ user_id: userId, ...profileUpdates });
        if (profileError) {
          console.error("Profile insert error:", profileError.message);
        }
      }
    }

    // Role handling (single active role)
    // First deactivate all existing roles for this user
    const { error: deactivateError } = await adminClient
      .from("user_roles")
      .update({ is_active: false })
      .eq("user_id", userId);
    
    if (deactivateError) {
      console.error("Role deactivation error:", deactivateError.message);
    }

    if (roleId) {
      // Check if a user_role row already exists for this user+role combo
      const { data: existingUserRole } = await adminClient
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role_id", roleId)
        .maybeSingle();

      if (existingUserRole) {
        // Re-activate the existing row
        const { error: roleUpdateError } = await adminClient
          .from("user_roles")
          .update({ is_active: true, updated_at: new Date().toISOString() })
          .eq("id", existingUserRole.id);
        if (roleUpdateError) {
          return new Response(
            JSON.stringify({ error: `Failed to update role: ${roleUpdateError.message}` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        // Insert a new user_role row
        const { error: roleInsertError } = await adminClient
          .from("user_roles")
          .insert({
            user_id: userId,
            role_id: roleId,
            is_active: true,
            valid_from: new Date().toISOString(),
          });
        if (roleInsertError) {
          return new Response(
            JSON.stringify({ error: `Failed to assign role: ${roleInsertError.message}` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // Staff linkage
    if (staffId) {
      // Unlink this user from any other staff
      const { error: unlinkError } = await adminClient
        .from("staff")
        .update({ user_id: null })
        .eq("user_id", userId);
      if (unlinkError) {
        console.error("Staff unlink error:", unlinkError.message);
      }
      // Link user to specified staff
      const { error: linkError } = await adminClient
        .from("staff")
        .update({ user_id: userId })
        .eq("id", staffId);
      if (linkError) {
        console.error("Staff link error:", linkError.message);
      }
    } else {
      const { error: unlinkError } = await adminClient
        .from("staff")
        .update({ user_id: null })
        .eq("user_id", userId);
      if (unlinkError) {
        console.error("Staff unlink error:", unlinkError.message);
      }
    }

    return new Response(JSON.stringify({ user_id: userId, success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Update user error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to update user" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
