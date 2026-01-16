# Payment Portal

Simple payment portal for ACH payments using Plaid + Dwolla.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

Fill in:
- **Dwolla keys** (from your Dwolla dashboard)
- **Plaid keys** (from your Plaid dashboard)
- **Schwab account info** (routing + account number)

### 3. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/payment-portal.git
git push -u origin main
```

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repo
4. Add environment variables in Vercel dashboard (same as .env.local)
5. Deploy

### 3. Environment Variables in Vercel

Add these in Vercel dashboard → Settings → Environment Variables:

```
DWOLLA_KEY=your_key
DWOLLA_SECRET=your_secret
DWOLLA_ENVIRONMENT=sandbox (or production)
NEXT_PUBLIC_PLAID_ENV=sandbox (or production)
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_secret
SCHWAB_ACCOUNT_NUMBER=your_account
SCHWAB_ROUTING_NUMBER=your_routing
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## Testing

Use sandbox mode first:
- Dwolla sandbox
- Plaid sandbox (test bank credentials)
- Test with fake money

## Going Live

1. Switch Dwolla to production ($25/mo starts)
2. Switch Plaid to production
3. Update environment variables in Vercel
4. Redeploy

## Notes

- First 100 Plaid bank links are free
- Dwolla charges $0.25 per ACH transaction
- Money settles in 1-2 business days

## TODO

- [ ] Add database for payment history (Vercel Postgres or Supabase)
- [ ] Complete Dwolla funding source creation
- [ ] Add email notifications
- [ ] Add autopay feature (future)
