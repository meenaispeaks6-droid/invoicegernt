## Problem

Google sign-in succeeds on the server (auth logs show successful `id_token` grant and a valid session for `georgemaine@growthx.ai`), but the UI stays on `/auth` after the popup closes. The user reads this as "sign-in didn't work."

Root cause: `src/pages/Auth.tsx`
- `handleGoogleSignIn` only sets `googleLoading = false` on the non-redirect (popup) success path — it never navigates.
- `Auth.tsx` has no effect that redirects to `/` when `user` becomes truthy, so a logged-in user can sit on `/auth` indefinitely.

The `ERR_BLOCKED_BY_CONTENT_BLOCKER` console noise is unrelated — those are Lovable editor analytics scripts (RudderStack, FB Pixel, GTM, TikTok, Bing, HubSpot) blocked by the browser. They do not affect auth.

## Fix

Edit `src/pages/Auth.tsx`:

1. Pull `user` from `useAuth()`.
2. Add a `useEffect` that calls `navigate("/", { replace: true })` whenever `user` is set — this covers both the Google popup flow and any future flow where the session arrives asynchronously.
3. In `handleGoogleSignIn`, after a successful non-redirect result, also call `navigate("/")` as a belt-and-suspenders measure.

No backend, RLS, or OAuth provider changes are needed — the lovable-managed Google flow is working correctly.

## Verification

- Click "Sign in with Google" in the editor preview → popup closes → land on `/` (Dashboard) without manual refresh.
- Reload `/auth` while already signed in → immediately redirected to `/`.
