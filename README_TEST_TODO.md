# TODO: Testare și Verificare Rute Backend

Bifează fiecare rută după ce a fost testată cu succes (inclusiv validări, erori, edge cases).

## Auth

- [X]  POST /auth/signup — creare cont (toate validările, deja logat, email existent, etc)
- [X]  POST /auth/login — autentificare (validări, deja logat, credentiale greșite)
- [X]  POST /auth/logout — delogare (cu/ fără cookie)
- [X]  GET /auth/me — returnează userul curent (autentificat/ neautentificat)
- [ ]  POST /auth/refresh — refresh token (cu/ fără cookie valid)
- [ ]  POST /auth/reset-password — placeholder (răspuns 501)

## User Profile

- [ ]  GET /user/profile — profilul userului (autentificat/ neautentificat)
- [ ]  PATCH /user/profile — update profil (validări, edge cases)

## Plans

- [ ]  GET /plans — listă planuri
- [ ]  GET /plans/user — planul userului curent (autentificat/ neautentificat)

## Stripe

- [ ]  POST /stripe/create-checkout-session — creare sesiune Stripe (autentificat, planId valid/invalid)
- [ ]  POST /stripe/cancel-subscription — anulare subscripție (autentificat, fără subscripție activă)
- [ ]  POST /stripe/webhook — webhook Stripe (simulare payload valid/invalid)

## Edge Cases & Securitate

- [ ]  Validare input (email, parolă, telefon, etc)
- [ ]  Rate limiting (testare spam signup/login)
- [ ]  CORS (doar domeniul frontend acceptat)
- [ ]  Cookie-uri HttpOnly/SameSite
- [ ]  Testare răspunsuri la erori (400, 401, 404, 500)
