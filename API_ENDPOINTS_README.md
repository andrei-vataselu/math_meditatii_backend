# Math Meditations Backend — API Endpoint Documentation

App runs for now on localhost:5000, endpoint should be configured with credentials true and should depend on env or prod. have a env variable for this
This README provides detailed documentation for every API endpoint in the backend, including request bodies, headers, cookies, and all possible responses. Use this to implement frontend integrations or for AI agents.

---

## General Notes

- All endpoints return JSON.
- Authentication is via JWT (HttpOnly cookies or `Authorization: Bearer <token>` header).
- Error responses always include a clear message and status code.
- Input validation and sanitization are enforced on all endpoints.

---

## Auth Endpoints

### POST `/auth/signup`

**Description:** Register a new user.

**Request Body:**

```json
{
  "email": "user@gmail.com",
  "password": "Password1!",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "0712345678"
}
```

**Headers:** None required
**Cookies:** None required

**Success Response:**

- Status: `201 Created`
- Body:
  ```json
  {
    "user": {
      "email": "user@gmail.com",
      "firstName": "John",
      "lastName": "Doe",
      "phoneNumber": "0712345678"
    }
  }
  ```
- Sets HttpOnly cookies: `accessToken`, `refreshToken`

**Error Responses:**

- `400 Bad Request`: Validation error, missing fields, already logged in, email exists
- `409 Conflict`: Duplicate email

---

### POST `/auth/login`

**Description:** Authenticate user and start session.

**Request Body:**

```json
{
  "email": "user@gmail.com",
  "password": "Password1!"
}
```

**Headers:** None required
**Cookies:** None required

**Success Response:**

- Status: `200 OK`
- Body:
  ```json
  {
    "user": {
      "email": "user@gmail.com",
      "firstName": "John",
      "lastName": "Doe",
      "phoneNumber": "0712345678"
    }
  }
  ```
- Sets HttpOnly cookies: `accessToken`, `refreshToken`

**Error Responses:**

- `400 Bad Request`: Invalid credentials, already logged in

---

### POST `/auth/logout`

**Description:** Log out user and invalidate session.

**Request Body:** None
**Headers:** None required
**Cookies:** `accessToken`, `refreshToken` (required)

**Success Response:**

- Status: `200 OK`
- Body: `{ "message": "Logged out" }`
- Clears cookies: `accessToken`, `refreshToken`

**Error Responses:**

- `500 Internal Server Error`: Logout failed

---

### GET `/auth/me`

**Description:** Get current authenticated user profile.

**Request Body:** None
**Headers:** `Authorization: Bearer <accessToken>` or cookie
**Cookies:** `accessToken` (required)

**Success Response:**

- Status: `200 OK`
- Body:
  ```json
  {
    "user": {
      "_id": "user_id",
      "email": "user@gmail.com",
      "firstName": "John",
      "lastName": "Doe",
      "phoneNumber": "0712345678",
      "plan": "Free"
    }
  }
  ```

**Error Responses:**

- `401 Unauthorized`: Invalid or missing token

---

### POST `/auth/refresh`

**Description:** Refresh access token using refresh token.

**Request Body:** None
**Headers:** None required
**Cookies:** `refreshToken` (required)

**Success Response:**

- Status: `200 OK`
- Body: `{ "message": "Token refreshed" }`
- Sets new `accessToken` cookie

**Error Responses:**

- `401 Unauthorized`: Invalid, expired, or missing refresh token

---

## User Endpoints

### PATCH `/user/profile`

**Description:** Update user profile fields (firstName, lastName, phoneNumber).

**Request Body:**

```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "phoneNumber": "0712345678"
}
```

**Headers:** `Authorization: Bearer <accessToken>` or cookie
**Cookies:** `accessToken` (required)

**Success Response:**

- Status: `200 OK`
- Body:
  ```json
  {
    "user": {
      "_id": "user_id",
      "email": "user@gmail.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "phoneNumber": "0712345678"
    }
  }
  ```

**Error Responses:**

- `400 Bad Request`: No changes detected, invalid fields
- `401 Unauthorized`: Missing or invalid token

---

## Plans Endpoints

### GET `/plans`

**Description:** Retrieve all available subscription plans.

**Request Body:** None
**Headers:** None required
**Cookies:** None required

**Success Response:**

- Status: `200 OK`
- Body:
  ```json
  {
    "plans": [
      {
        "_id": "plan_id",
        "name": "Free",
        "price": 0,
        "features": ["Basic access", "Limited resources"],
        "isActive": true
      },
      {
        "_id": "plan_id",
        "name": "Premium",
        "price": 180,
        "features": ["Full access", "Priority support", "Advanced resources"],
        "isActive": true
      }
    ]
  }
  ```

**Error Responses:**

- `500 Internal Server Error`: Could not retrieve plans

---

### GET `/plans/user`

**Description:** Retrieve the current authenticated user's plan details.

**Request Body:** None
**Headers:** `Authorization: Bearer <accessToken>` or cookie
**Cookies:** `accessToken` (required)

**Success Response:**

- Status: `200 OK`
- Body:
  ```json
  {
    "plan": {
      "_id": "plan_id",
      "name": "Free",
      "price": 0,
      "features": ["Basic access", "Limited resources"],
      "isActive": true
    }
  }
  ```

**Error Responses:**

- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: User or plan not found

---

## Stripe Endpoints

### POST `/stripe/create-checkout-session`

**Description:** Create a Stripe checkout session for a plan.

**Request Body:**

```json
{
  "planId": "<valid_plan_id>"
}
```

**Headers:** `Authorization: Bearer <accessToken>` or cookie
**Cookies:** `accessToken` (required)

**Success Response:**

- Status: `200 OK`
- Body:
  ```json
  {
    "url": "https://checkout.stripe.com/pay/cs_test_..."
  }
  ```

**Error Responses:**

- `404 Not Found`: Plan not found
- `401 Unauthorized`: Missing or invalid token

---

### POST `/stripe/cancel-subscription`

**Description:** Cancel the user's active Stripe subscription.

**Request Body:** None
**Headers:** `Authorization: Bearer <accessToken>` or cookie
**Cookies:** `accessToken` (required)

**Success Response:**

- Status: `200 OK`
- Body:
  ```json
  {
    "message": "Subscription will be cancelled at the end of the billing period",
    "periodEnd": "2025-08-28T00:00:00.000Z"
  }
  ```

**Error Responses:**

- `400 Bad Request`: No active subscription found, no Stripe customer
- `401 Unauthorized`: Missing or invalid token

---

### POST `/stripe/webhook`

**Description:** Stripe webhook endpoint for event notifications (internal use).

**Request Body:** Raw Stripe event payload
**Headers:** `Stripe-Signature` (required)
**Cookies:** None required

**Success Response:**

- Status: `200 OK`
- Body:
  ```json
  {
    "received": true
  }
  ```

**Error Responses:**

- `400 Bad Request`: Invalid signature
- `500 Internal Server Error`: Webhook processing failed

---

## Health Endpoint

### GET `/healthz`

**Description:** Health check for backend service.

**Request Body:** None
**Headers:** None required
**Cookies:** None required

**Success Response:**

- Status: `200 OK`
- Body:
  ```json
  {
    "status": "healthy",
    "timestamp": "2025-07-28T12:00:00.000Z",
    "uptime": 123.45,
    "environment": "development",
    "version": "1.0.0"
  }
  ```

---

## Error Response Format

All error responses follow this format:

```json
{
  "message": "<error_description>"
}
```

Or, for validation errors:

```json
{
  "errors": [
    { "field": "email", "message": "Email invalid" },
    { "field": "password", "message": "Password too weak" }
  ]
}
```

---

## Security & Validation

- All sensitive endpoints require JWT authentication (HttpOnly cookie or `Authorization` header).
- Input validation and sanitization are enforced (see `validators/userValidators.js`).
- Rate limiting is applied to authentication endpoints.
- Stripe webhook verifies signature and prevents duplicate event processing.
- No sensitive info is leaked in error responses.

---

---

## Error Types & Formats

All endpoints return errors in a consistent JSON format. Below are the main error types and their structures, with examples for each endpoint:

### 1. Validation Errors

Returned when input data fails validation (e.g., missing fields, invalid format).

**Format:**

```json
{
  "errors": [
    {
      "field": "firstName",
      "message": "Prenumele este obligatoriu și trebuie să aibă între 1 și 50 de caractere"
    },
    {
      "field": "lastName",
      "message": "Numele este obligatoriu și trebuie să aibă între 1 și 50 de caractere"
    },
    { "field": "email", "message": "Email invalid" },
    {
      "field": "email",
      "message": "Emailul trebuie să aibă între 6 și 50 de caractere"
    },
    {
      "field": "email",
      "message": "Emailul trebuie să fie de la un provider popular (gmail, yahoo, outlook, etc)"
    },
    {
      "field": "password",
      "message": "Parola trebuie să aibă între 8 și 64 de caractere"
    },
    {
      "field": "password",
      "message": "Parola trebuie să conțină cel puțin o cifră"
    },
    {
      "field": "password",
      "message": "Parola trebuie să conțină cel puțin o literă mare"
    },
    {
      "field": "password",
      "message": "Parola trebuie să conțină cel puțin un simbol"
    }
  ]
}
```

### 2. Authentication & Authorization Errors

Returned when JWT is missing, invalid, expired, or user is not authorized.

**Format:**

```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

Or:

```json
{
  "error": "Unauthorized",
  "message": "No access token provided"
}
```

### 3. Business Logic Errors

Returned for cases like "No changes detected", "Already logged in", "Plan not found", etc.

**Format:**

```json
{
  "message": "No changes detected."
}
```

Or:

```json
{
  "message": "Plan not found"
}
```

### 4. Server Errors

Returned for unexpected errors or failures.

**Format:**

```json
{
  "message": "Internal Server Error"
}
```

### 5. Stripe Webhook Errors

Specific to Stripe webhook endpoint.

**Format:**

```json
{
  "error": "Webhook Error: <details>"
}
```

---

## Error Types by Endpoint

**/auth/signup, /auth/login, /user/profile**

- Validation errors (see above)
- Business logic errors (already logged in, no changes detected)
- Authentication errors (missing/invalid token)

**/auth/logout, /auth/me, /auth/refresh, /plans/user, /stripe/\*, /plans**

- Authentication errors (missing/invalid token)
- Business logic errors (plan not found, no active subscription)
- Server errors (internal failures)

**/stripe/webhook**

- Signature verification errors
- Webhook processing errors

---

_This documentation is ready for use by frontend developers or AI agents to implement all backend integrations._
