import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { checkRateLimit, recordFailedAttempt, getClientIdentifier, cleanupExpiredEntries } from "../_shared/rate-limiter.ts";

// Rate limit configuration for PIN attempts
const PIN_RATE_LIMIT_CONFIG = {
  maxAttempts: 5,           // 5 attempts allowed
  windowMs: 60 * 60 * 1000, // per hour
  lockoutMs: 15 * 60 * 1000, // 15 minute lockout after exceeding
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req);

  // Periodic cleanup of expired rate limit entries
  cleanupExpiredEntries();

  try {
    const { invoiceId, shareToken, pinCode } = await req.json();

    if (!invoiceId || !shareToken) {
      return new Response(
        JSON.stringify({ error: "Invoice ID and share token are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get client identifier for rate limiting (IP-based + invoice combo)
    const clientIp = getClientIdentifier(req);
    const rateLimitKey = `${clientIp}:${invoiceId}`;

    // Create Supabase client with service role key to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch invoice by ID AND validate share token
    const { data: invoice, error: fetchError } = await supabase
      .from("invoices")
      .select(`
        id,
        user_id,
        invoice_number,
        status,
        issue_date,
        due_date,
        subtotal,
        tax_rate,
        tax_amount,
        total,
        notes,
        viewed_at,
        share_token,
        pin_code,
        payment_methods,
        payment_intro_text,
        payment_outro_text,
        payment_reference,
        clients (name, email, company, address),
        invoice_items (id, description, quantity, unit_price, amount)
      `)
      .eq("id", invoiceId)
      .eq("share_token", shareToken)
      .single();

    if (fetchError || !invoice) {
      return new Response(
        JSON.stringify({ error: "Invoice not found or invalid share link" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If PIN is required but not provided, return that PIN is needed
    if (!pinCode) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          requiresPin: true,
          invoiceNumber: invoice.invoice_number
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check rate limit BEFORE validating PIN
    const rateLimitResult = checkRateLimit(rateLimitKey, PIN_RATE_LIMIT_CONFIG);
    
    if (!rateLimitResult.allowed) {
      const retryAfterSeconds = Math.ceil((rateLimitResult.retryAfterMs || 0) / 1000);
      console.warn(`Rate limit exceeded for ${rateLimitKey}. Retry after ${retryAfterSeconds}s`);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Too many incorrect PIN attempts. Please try again later.",
          requiresPin: true,
          invoiceNumber: invoice.invoice_number,
          retryAfterSeconds,
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": String(retryAfterSeconds),
          } 
        }
      );
    }

    // Validate PIN code (case-insensitive, trim whitespace)
    const providedPin = String(pinCode).trim();
    const storedPin = String(invoice.pin_code).trim();
    
    if (providedPin !== storedPin) {
      // Record failed attempt for audit logging
      recordFailedAttempt(rateLimitKey);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Incorrect PIN",
          requiresPin: true,
          invoiceNumber: invoice.invoice_number,
          remainingAttempts: rateLimitResult.remainingAttempts,
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // PIN is correct - mark as viewed if first time
    let firstView = false;
    if (invoice.viewed_at === null && invoice.status !== "draft") {
      const { error: updateError } = await supabase
        .from("invoices")
        .update({ viewed_at: new Date().toISOString() })
        .eq("id", invoiceId);

      if (updateError) {
        console.error("Error updating invoice:", updateError);
      } else {
        firstView = true;
      }
    }

    // Return invoice data (excluding sensitive fields)
    const { share_token: _shareToken, pin_code: _pinCode, user_id, ...safeInvoice } = invoice;

    // Fetch the issuing business's settings to render the invoice header & footer
    const { data: business_settings } = await supabase
      .from("business_settings")
      .select(
        "company_name, company_email, company_phone, logo_url, address_line1, address_line2, city, state, postal_code, country, tax_id, payment_instructions, default_currency"
      )
      .eq("user_id", user_id)
      .maybeSingle();

    return new Response(
      JSON.stringify({ 
        success: true, 
        firstView,
        invoice: { ...safeInvoice, business_settings: business_settings ?? null }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in mark-invoice-viewed:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
