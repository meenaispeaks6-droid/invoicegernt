// Simple in-memory rate limiter for edge functions
// Note: In a production environment with multiple instances, use Redis or a database

interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
  lockedUntil: number | null;
}

// In-memory store (resets on function cold start)
const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  maxAttempts: number;        // Maximum attempts allowed in the window
  windowMs: number;           // Time window in milliseconds
  lockoutMs: number;          // Lockout duration after exceeding max attempts
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 60 * 60 * 1000,   // 1 hour window
  lockoutMs: 15 * 60 * 1000,  // 15 minute lockout
};

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): { allowed: boolean; remainingAttempts: number; retryAfterMs?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // Check if currently locked out
  if (entry?.lockedUntil && now < entry.lockedUntil) {
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterMs: entry.lockedUntil - now,
    };
  }

  // Check if window has expired, reset if so
  if (!entry || now - entry.firstAttempt > config.windowMs) {
    rateLimitStore.set(identifier, {
      attempts: 1,
      firstAttempt: now,
      lockedUntil: null,
    });
    return { allowed: true, remainingAttempts: config.maxAttempts - 1 };
  }

  // Check if max attempts exceeded
  if (entry.attempts >= config.maxAttempts) {
    // Apply lockout
    entry.lockedUntil = now + config.lockoutMs;
    rateLimitStore.set(identifier, entry);
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterMs: config.lockoutMs,
    };
  }

  // Increment attempts
  entry.attempts += 1;
  rateLimitStore.set(identifier, entry);
  return {
    allowed: true,
    remainingAttempts: config.maxAttempts - entry.attempts,
  };
}

export function recordFailedAttempt(identifier: string): void {
  // Already counted in checkRateLimit, but this can be used for additional logging
  console.warn(`Failed PIN attempt for identifier: ${identifier}`);
}

export function getClientIdentifier(req: Request): string {
  // Try to get real IP from various headers
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  
  // Use the first available IP, or fall back to a default
  const ip = forwardedFor?.split(",")[0]?.trim() || 
             realIp || 
             cfConnectingIp || 
             "unknown";
  
  return ip;
}

// Cleanup old entries periodically (call this occasionally)
export function cleanupExpiredEntries(windowMs: number = DEFAULT_CONFIG.windowMs): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    // Remove entries that are past their window and not locked out
    if (now - entry.firstAttempt > windowMs && (!entry.lockedUntil || now > entry.lockedUntil)) {
      rateLimitStore.delete(key);
    }
  }
}
