import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);

  try {
    // Get the authorization header to identify the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role key to perform admin operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // First, verify the user's identity using their JWT
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });
    
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Now use service role client to delete user data and auth record
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Delete user data from all tables (cascade order)
    // 1. Get all invoice IDs for this user
    const { data: invoices } = await adminClient
      .from("invoices")
      .select("id")
      .eq("user_id", user.id);
    
    const invoiceIds = invoices?.map((i) => i.id) || [];

    // 2. Delete invoice items
    if (invoiceIds.length > 0) {
      await adminClient.from("invoice_items").delete().in("invoice_id", invoiceIds);
    }

    // 3. Delete invoices
    await adminClient.from("invoices").delete().eq("user_id", user.id);

    // 4. Delete clients
    await adminClient.from("clients").delete().eq("user_id", user.id);

    // 5. Delete payment templates
    await adminClient.from("payment_instruction_templates").delete().eq("user_id", user.id);

    // 6. Delete user settings
    await adminClient.from("user_settings").delete().eq("user_id", user.id);

    // 7. Delete user's storage objects (logos)
    const { data: files } = await adminClient.storage
      .from("invoice-logos")
      .list(user.id);

    if (files && files.length > 0) {
      const filePaths = files.map((file) => `${user.id}/${file.name}`);
      await adminClient.storage.from("invoice-logos").remove(filePaths);
    }

    // 8. Finally, delete the auth user record
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error("Error deleting auth user:", deleteError);
      return new Response(
        JSON.stringify({ error: "Failed to delete authentication record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Account deleted successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in delete-account:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
