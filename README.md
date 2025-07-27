# Math Meditations Backend

A secure, scalable Express.js backend using MongoDB, JWT authentication, and Stripe payments. Designed to replace Supabase and work seamlessly with a Vercel-hosted Next.js frontend.

## Tech Stack
- **Backend:** Express.js
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT + bcrypt (HttpOnly cookies)
- **Payments:** Stripe
- **Environment:** dotenv
- **Security:** Helmet, CORS, input validation, rate limiting

## Project Structure
```
/project-root
├── config/             # DB and Stripe configs
├── controllers/        # All logic here (auth, user, plans, stripe)
├── middlewares/        # Auth, error handling, rate limiters
├── models/             # Mongoose models (User, Plan)
├── routes/             # Express route files
├── utils/              # Helpers (e.g. token management)
├── app.js              # App setup
├── server.js           # App start
├── .env                # Env vars
├── .gitignore
└── package.json
```

## Setup
1. Clone the repo
2. Run `npm install`
3. Create a `.env` file (see below)
4. Start with `npm run dev` (nodemon) or `npm start`

## .env Example
```
PORT=5000
MONGO_URI=your_mongo_uri
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d
STRIPE_SECRET_KEY=your_stripe_key
STRIPE_WEBHOOK_SECRET=your_webhook_key
CLIENT_URL=https://your-frontend.vercel.app
```

## API Endpoints

### Auth
| Method | Path                | Description                | Auth Required |
|--------|---------------------|----------------------------|--------------|
| POST   | /auth/signup        | Register new user          | No           |
| POST   | /auth/login         | Login user                 | No           |
| POST   | /auth/logout        | Logout user                | Yes (JWT)    |
| GET    | /auth/me            | Get current user           | Yes (JWT)    |
| POST   | /auth/refresh       | Refresh JWT using refresh  | Yes (cookie) |
| POST   | /auth/reset-password| Reset password (placeholder)| No           |

### User Profile
| Method | Path           | Description         | Auth Required |
|--------|----------------|---------------------|--------------|
| GET    | /user/profile  | Get user profile    | Yes (JWT)    |
| PATCH  | /user/profile  | Update profile      | Yes (JWT)    |

### Plans
| Method | Path         | Description           | Auth Required |
|--------|--------------|-----------------------|--------------|
| GET    | /plans       | Get all plans         | No           |
| GET    | /plans/user  | Get current user's plan| Yes (JWT)    |

### Stripe Payments
| Method | Path                          | Description                | Auth Required |
|--------|-------------------------------|----------------------------|--------------|
| POST   | /stripe/create-checkout-session| Create Stripe checkout     | Yes (JWT)    |
| POST   | /stripe/cancel-subscription   | Cancel Stripe subscription | Yes (JWT)    |
| POST   | /stripe/webhook               | Stripe webhook (internal)  | No           |

## Security
- JWT stored in HttpOnly, SameSite=Strict cookies
- Helmet for secure headers
- CORS restricted to frontend domain
- Input validation and sanitization
- Rate limiting on auth routes
- Passwords hashed with bcrypt

## Notes
- Refresh tokens are in-memory (use Redis/DB for production)
- Stripe webhook endpoint must be set in Stripe dashboard
- No email verification (can be added later) 