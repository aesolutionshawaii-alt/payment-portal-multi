import { sql } from '@vercel/postgres';

export interface User {
  id: number;
  email: string;
  plaid_access_token: string | null;
  stripe_customer_id: string | null;
  selected_account_id: string | null;
  created_at: Date;
  updated_at: Date;
}

// Initialize the database table
export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      plaid_access_token TEXT,
      stripe_customer_id VARCHAR(255),
      selected_account_id VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
}

// Get user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await sql`
    SELECT * FROM users WHERE email = ${email.toLowerCase()}
  `;
  return result.rows[0] as User || null;
}

// Create user
export async function createUser(email: string): Promise<User> {
  const result = await sql`
    INSERT INTO users (email)
    VALUES (${email.toLowerCase()})
    RETURNING *
  `;
  return result.rows[0] as User;
}

// Get or create user
export async function getOrCreateUser(email: string): Promise<User> {
  let user = await getUserByEmail(email);
  if (!user) {
    user = await createUser(email);
  }
  return user;
}

// Update user's Plaid token
export async function updateUserPlaidToken(email: string, plaidAccessToken: string): Promise<User> {
  const result = await sql`
    UPDATE users
    SET plaid_access_token = ${plaidAccessToken}, updated_at = CURRENT_TIMESTAMP
    WHERE email = ${email.toLowerCase()}
    RETURNING *
  `;
  return result.rows[0] as User;
}

// Update user's Stripe customer ID
export async function updateUserStripeCustomer(email: string, stripeCustomerId: string): Promise<User> {
  const result = await sql`
    UPDATE users
    SET stripe_customer_id = ${stripeCustomerId}, updated_at = CURRENT_TIMESTAMP
    WHERE email = ${email.toLowerCase()}
    RETURNING *
  `;
  return result.rows[0] as User;
}

// Update user's selected account
export async function updateUserSelectedAccount(email: string, accountId: string): Promise<User> {
  const result = await sql`
    UPDATE users
    SET selected_account_id = ${accountId}, updated_at = CURRENT_TIMESTAMP
    WHERE email = ${email.toLowerCase()}
    RETURNING *
  `;
  return result.rows[0] as User;
}

// Clear user's Plaid connection (for re-linking)
export async function clearUserPlaidConnection(email: string): Promise<User> {
  const result = await sql`
    UPDATE users
    SET plaid_access_token = NULL, selected_account_id = NULL, updated_at = CURRENT_TIMESTAMP
    WHERE email = ${email.toLowerCase()}
    RETURNING *
  `;
  return result.rows[0] as User;
}
