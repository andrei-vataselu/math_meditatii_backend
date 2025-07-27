# API Endpoints Test Checklist

Bifează fiecare rută după ce a fost testată cu succes (inclusiv validări, erori, edge cases).

## Health
- [ x] **GET** `/healthz` — Health check endpoint

## Auth
- [x ] **POST** `/auth/logout` — Delogare
- [x ] **GET** `/auth/me` — Userul curent (autentificat)
- [ ] **POST** `/auth/refresh` — Refresh token
 
## User
- [ ] **PATCH** `/user/profile` — Actualizare profil user

## Plans
- [ ] **GET** `/plans/` — Listă planuri disponibile
- [ ] **GET** `/plans/user` — Planul userului curent

## Stripe
- [ ] **POST** `/stripe/create-checkout-session` — Creare sesiune Stripe
- [ ] **POST** `/stripe/cancel-subscription` — Anulare subscripție
- [ ] **POST** `/stripe/webhook` — Webhook Stripe (intern)

---

### Recomandări pentru testare:
- Testează fiecare rută pentru cazuri de succes, validări, erori (400, 401, 404, 500), edge cases.
- Verifică protecția cu JWT acolo unde este cazul.
- Simulează payload-uri invalide și lipsă autentificare.
- Testează rate limiting, CORS, cookie-uri HttpOnly/SameSite, input sanitization.

---

_Actualizat: 2025-07-28_
