# Payment Portal (Multi-User)

A multi-user payment portal supporting ACH bank transfers (via Plaid + Stripe) and credit card payments.

## Features

- **Multi-user support** - Anyone can use the portal with their email
- **ACH payments** - Lower fees (0.8%) via Plaid bank linking
- **Credit card payments** - Stripe card processing (2.9% + $0.30)
- **Payment history** - Per-user transaction history
- **Account selection** - Choose which bank account to pay from

## How It Works

1. User enters their email
2. Links their bank account via Plaid (one-time setup)
3. Selects account and enters payment amount
4. Payment is processed via Stripe ACH or card

## Setup

### 1. Environment Variables

```
# Plaid
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_secret
NEXT_PUBLIC_PLAID_ENV=sandbox  # or production

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx

# App URL (for Plaid OAuth redirect)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### 2. Database Setup (Neon Postgres)

1. In Vercel dashboard, go to **Storage** → **Create Database**
2. Select **Neon** (Serverless Postgres)
3. Choose Free tier, click Continue
4. Connect to your project with prefix `POSTGRES`
5. Redeploy the project

### 3. Initialize Database

After deployment, visit:
```
https://your-app.vercel.app/api/db/init
```

This creates the `users` table.

### 4. Register Plaid Redirect URI

In Plaid Dashboard → API → Allowed redirect URIs, add:
```
https://your-app.vercel.app
```

## Local Development

```bash
npm install
npm run dev
```

## Deployment

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Set up Neon Postgres (see above)
5. Initialize database
6. Register Plaid redirect URI

## Database Schema

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  plaid_access_token TEXT,
  stripe_customer_id VARCHAR(255),
  selected_account_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Routes

- `POST /api/user` - Get or create user by email
- `PATCH /api/user` - Update user (selected account, clear bank)
- `GET /api/plaid/create-link-token` - Get Plaid Link token
- `POST /api/plaid/exchange-token` - Exchange public token for access token
- `POST /api/plaid/get-accounts` - Get user's linked bank accounts
- `POST /api/payment/create` - Create ACH payment
- `POST /api/payment/create-card-intent` - Create card payment intent
- `GET /api/payment/history` - Get user's payment history
- `GET /api/db/init` - Initialize database tables

## Notes

- ACH payments take 1-2 business days to settle
- Stripe ACH fee: 0.8% (capped at $5)
- Stripe card fee: 2.9% + $0.30
- Plaid: First 100 links free, then usage-based pricing
