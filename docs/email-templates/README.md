# Auth email templates

Branded HTML for Supabase → **Authentication → Email Templates**. All share the
toybox look (cream, 40/40/20 stripe, hosted logo, 6-digit code box + button) and
the live logo at `https://chorey.co/icon-512.png`.

## Map: file → Supabase template → subject → used?

| File | Supabase template | Suggested subject | Used today? |
|------|-------------------|-------------------|-------------|
| `auth-magic-link.html` | **Confirm signup** | `Your Chorey sign-in code` | ✅ Yes — new sign-ups |
| `auth-magic-link.html` | **Magic Link / OTP** | `Your Chorey sign-in code` | ✅ Yes — returning sign-ins |
| `auth-reset-password.html` | Reset password | `Reset your Chorey password` | ❌ No — app is passwordless |
| `auth-change-email.html` | Change email address | `Confirm your new Chorey email` | ❌ No — no in-app email change |

## Why two "sign-in" slots?
Same content, different event: Supabase sends **Confirm signup** to a brand-new
email and **Magic Link** to a returning one. Paste `auth-magic-link.html` into
**both** so new and returning users get the same branded email.

## When pasting
- Keep `{{ .Token }}` (6-digit code) and `{{ .ConfirmationURL }}` (button link).
- In the editor these show as literal text — they're only substituted in the
  real sent email. Test by triggering a real sign-in to your own address.
- The reset-password / change-email templates are **future-proofing**; they
  never send unless password login or an email-change flow is added.
