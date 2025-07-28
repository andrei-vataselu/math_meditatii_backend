# Endpoint Test Checklist

Test each endpoint with valid and invalid data. For each, specify the request body and expected response.

---

## Auth

### POST /auth/signup

**Body:**

```
{
  "email": "user@gmail.com",
  "password": "Password1!",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "0712345678"
}
```

- Test: valid signup, missing fields, invalid email, weak password, duplicate email, invalid phone

### POST /auth/login

**Body:**

```
{
  "email": "user@gmail.com",
  "password": "Password1!"
}
```

- Test: valid login, wrong password, non-existent email, missing fields

### POST /auth/logout

**Body:** None (cookie required)

- Test: valid logout, no cookie

### GET /auth/me

**Body:** None (JWT required)

- Test: valid JWT, missing/invalid JWT

### POST /auth/refresh

**Body:** None (refresh token cookie required)

- Test: valid refresh, expired/invalid/reused token, no cookie

---

## User

### PATCH /user/profile

**Body:**

```
{
  "firstName": "Jane",
  "lastName": "Smith",
  "phoneNumber": "0712345678"
}
```

- Test: valid update, missing/invalid fields, invalid phone, unauthorized

---

## Plans

### GET /plans

**Body:** None

- Test: returns list of plans

### GET /plans/user

**Body:** None (JWT required)

- Test: valid JWT, missing/invalid JWT

---

## Stripe

### POST /stripe/create-checkout-session

**Body:**

```
{
  "planId": "<valid_plan_id>"
}
```

- Test: valid planId, invalid/missing planId, unauthorized

### POST /stripe/cancel-subscription

**Body:** None (JWT required)

- Test: valid subscription, no active subscription, unauthorized

### POST /stripe/webhook

**Body:** Stripe event payload (raw)

- Test: valid event, invalid signature, duplicate event

---

## Health

### GET /healthz

**Body:** None

- Test: returns status 200 and health info

---

**For each test:**

- Check response status and body
- Validate error handling and security (no sensitive info leaked)
- Test edge cases (missing fields, invalid data, unauthorized access)
