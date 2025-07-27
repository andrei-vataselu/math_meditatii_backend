# Security Audit Report

_This report summarizes all identified security issues and best-practice gaps in the Math Meditations backend, ranked from **Low** to **Crucial** severity._

---

## Crucial

### 1. Environment Variable Hygiene
- **Issue:** `.env` file is present in the repo root. If ever committed or leaked, secrets (JWT, DB, Stripe, email) are exposed.
- **Recommendation:** Ensure `.env` is always in `.gitignore` and never committed. Rotate secrets if exposure is suspected.

### 2. Stripe Webhook Security
- **Issue:** Webhook endpoint uses signature verification (good) but is public and could be targeted for DoS or replay attacks.
- **Recommendation:**
  - Ensure webhook secret is strong and rotated if leaked.
  - Consider rate limiting `/stripe/webhook` endpoint and IP allowlisting if possible.
  - Monitor and alert on repeated failures or suspicious activity.

### 3. Token Secrets & Rotation
- **Issue:** JWT secrets are loaded from environment, but if weak or reused, tokens can be forged.
- **Recommendation:** Use long, random secrets for `JWT_SECRET` and `JWT_REFRESH_SECRET`. Rotate periodically.

### 4. Password Reset (Potential)
- **Issue:** The todo mentions: "important: remove password for reset password". If passwords are ever exposed or sent in clear, this is a critical risk.
- **Recommendation:** Never expose or email passwords. Use one-time, time-limited reset tokens.

---

## High

### 5. CORS Configuration
- **Issue:** CORS allows credentials and uses an environment variable for allowed origins, but fallback is `http://localhost:3000` (safe for dev, but risky if not set in prod).
- **Recommendation:** Always restrict `origin` to the production frontend domain in production. Never use wildcards with credentials.

### 6. Logging Sensitive Data
- **Issue:** Winston logger includes a sanitizer, but always ensure sensitive fields (passwords, tokens, secrets) are redacted in all logs, especially in error and debug logs.
- **Recommendation:** Periodically audit logs for leaks. Avoid logging full request/response bodies.

### 7. Rate Limiting Granularity
- **Issue:** Global rate limit is set (100/15min), and a stricter limiter exists for auth, but ensure all sensitive endpoints (login, password reset, webhook) have appropriate, tighter limits.
- **Recommendation:** Use route-specific rate limiting for `/auth`, `/stripe/webhook`, and similar endpoints.

### 8. Error Messages
- **Issue:** Error handler hides stack traces in production, but some error messages may still leak internal details (e.g., validation errors, DB errors).
- **Recommendation:** Always use generic error messages for clients. Log details only internally.

---

## Moderate

### 9. Cookie Security
- **Issue:** Cookies are set with `httpOnly`, `sameSite: 'strict'`, and `secure` (in production), which is good. However, ensure all token cookies are cleared on logout and token rotation.
- **Recommendation:** Periodically review cookie settings and flows for gaps.

### 10. Input Validation
- **Issue:** Uses `express-validator`, `xss-clean`, and `express-mongo-sanitize`, but always ensure all user input is validated and sanitized, especially in new routes.
- **Recommendation:** Add validation to any new endpoints and review existing ones periodically.

### 11. Stripe Webhook Event Handling
- **Issue:** Only the last ~1000 processed event IDs are tracked in memory to prevent replay. On server restart, this is lost.
- **Recommendation:** Consider persisting processed event IDs for high-value events if replay attacks are a concern.

---

## Low

### 12. Console Logging in Production
- **Issue:** `console.log` is disabled in production, but double-check for accidental console statements.
- **Recommendation:** Use Winston or similar for all logging.

### 13. Dependency Updates
- **Issue:** Regularly update dependencies to patch known vulnerabilities (npm audit, etc).

---

## General Best Practices
- Use HTTPS everywhere (enforced by Google Cloud Run).
- Use unique secrets per environment.
- Never expose stack traces or internal errors to users.
- Rotate secrets and credentials regularly.
- Monitor and alert on suspicious activity (login failures, payment issues, etc).

---

**Reviewed:** 2025-07-28

_If you address the above issues, your backend will be highly robust against most common attack vectors._
