// Allowed origins for CORS
const allowedOrigins = [
  "https://billie-invoice-generator.lovable.app",
  "https://id-preview--d8bbbbac-6f06-43a1-ad55-549574b2551a.lovable.app",
  "http://localhost:5173",
  "http://localhost:8080",
];

export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin") || "";
  
  // Check if origin is in allowed list
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
}

export function handleCorsPreflightRequest(request: Request): Response | null {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(request) });
  }
  return null;
}
