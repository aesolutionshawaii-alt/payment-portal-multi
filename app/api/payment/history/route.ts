import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getUserByEmail } from '@/lib/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email')

    if (!email) {
      return NextResponse.json({ payments: [] })
    }

    // Get user from database to find their Stripe customer ID
    const user = await getUserByEmail(email)

    if (!user?.stripe_customer_id) {
      // No Stripe customer yet, return empty history
      return NextResponse.json({ payments: [] })
    }

    // Fetch charges from Stripe for this customer
    const charges = await stripe.charges.list({
      limit: 50,
      customer: user.stripe_customer_id,
    })

    const payments = charges.data
      .filter(charge => charge.amount >= 1000) // Only show payments $10 or more
      .map(charge => ({
        id: charge.id,
        amount: charge.amount / 100,
        date: new Date(charge.created * 1000).toISOString(),
        status: charge.status,
      }))

    return NextResponse.json({ payments })
  } catch (error: any) {
    console.error('Error fetching payment history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment history', payments: [] },
      { status: 500 }
    )
  }
}
