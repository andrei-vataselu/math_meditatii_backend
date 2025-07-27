# Math Meditations Backend — Test & QA Checklist

## ✅ Features & Enhancements Implemented
- RefreshToken model (MongoDB): rotation, reuse detection, revocation
- Secure JWT access/refresh token management
- Enhanced authentication/refresh middlewares
- Winston logger utility (structured, redacts sensitive info, disables console in prod)
- Stripe integration: customer, subscription, webhook hardening (duplicate prevention, event logging)
- Health check endpoint (`/healthz`)
- Input sanitization (xss-clean, express-mongo-sanitize)
- Enhanced CORS & security headers (Helmet)
- Error handler middleware (safe prod responses, logs)
- Email utility for notifications (SendGrid/Mailgun/Gmail ready)
- Secure password reset (token-based, never returns password)
- Dockerfile, .dockerignore, cloudbuild.yaml for deployment

## 🧪 Manual QA Checklist — What to Test
- [ ] User registration (signup) — with new, existing, and invalid data
- [ ] Login — valid/invalid credentials, correct cookie/token set
- [ ] Logout — tokens/cookies cleared
- [ ] Access protected route (e.g. `/me`) with/without valid token
- [ ] Refresh token flow — valid/invalid/expired/reused token
- [ ] Stripe payment: subscription creation, cancellation, webhook events
- [ ] Health check endpoint returns 200 OK
- [ ] Password reset: request (email sent), confirm (token, new password)
- [ ] Input sanitization: try XSS/mongo injection in forms
- [ ] Error responses: prod/dev, safe messages, logs
- [ ] Email notifications: received for reset, Stripe events (if configured)
- [ ] Docker container builds and runs, env vars loaded

## 📡 API Endpoints to Test

### Auth
- `POST /signup` — Register user
- `POST /login` — Login user
- `POST /logout` — Logout user
- `GET /me` — Get current user (protected)
- `POST /refresh` — Refresh access token

### Stripe
- `POST /stripe/checkout-session` — Create Stripe checkout session
- `POST /stripe/cancel-subscription` — Cancel subscription
- `POST /stripe/webhook` — Stripe event webhook (test with Stripe CLI)

### Misc
- `GET /healthz` — Health check

---

**Instructions:**
- Test endpoints using Postman, Insomnia, or your frontend.
- Simulate error cases (invalid tokens, expired, reused, etc.).
- Check logs for redacted sensitive info and correct log levels.
- If using Docker, ensure build and run are successful.
- If using email, check inbox for reset and notification emails.

---
