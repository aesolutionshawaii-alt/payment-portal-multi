export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server'
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'
import { updateUserPlaidToken } from '@/lib/db'

function getPlaidClient() {
  const configuration = new Configuration({
    basePath: PlaidEnvironments[process.env.NEXT_PUBLIC_PLAID_ENV as 'sandbox' | 'production'],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
        'PLAID-SECRET': process.env.PLAID_SECRET,
      },
    },
  })
  return new PlaidApi(configuration)
}

export async function POST(request: NextRequest) {
  try {
    const { public_token, email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const plaidClient = getPlaidClient()
    const response = await plaidClient.itemPublicTokenExchange({
      public_token,
    })

    // Save access token to database
    await updateUserPlaidToken(email, response.data.access_token)

    return NextResponse.json({
      success: true,
      item_id: response.data.item_id,
    })
  } catch (error) {
    console.error('Error exchanging token:', error)
    return NextResponse.json(
      { error: 'Failed to exchange token' },
      { status: 500 }
    )
  }
}
