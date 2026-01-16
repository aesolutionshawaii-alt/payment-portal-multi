'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export interface PaymentFormProps {
  email: string
  paymentMethod?: 'bank' | 'card'
  onPaymentComplete?: () => void
  accountId?: string
}

function PaymentFormContent({
  email,
  paymentMethod = 'bank',
  onPaymentComplete,
  accountId,
}: PaymentFormProps) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const stripe = useStripe()
  const elements = useElements()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      if (paymentMethod === 'card') {
        if (!stripe || !elements) throw new Error('Stripe not loaded')
        const cardElement = elements.getElement(CardElement)
        if (!cardElement) throw new Error('Card element not found')

        const response = await fetch('/api/payment/create-card-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: parseFloat(amount), email }),
        })
        const { clientSecret } = await response.json()

        const result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: { card: cardElement },
        })
        if (result.error) throw new Error(result.error.message)

        setSuccess(true)
        setAmount('')
        cardElement.clear()
      } else {
        const response = await fetch('/api/payment/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: parseFloat(amount), email, account_id: accountId }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || data.details || 'Payment failed')

        setSuccess(true)
        setAmount('')
      }

      onPaymentComplete?.()
      setTimeout(() => window.location.reload(), 1500)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-gray-400 text-sm font-medium mb-3 uppercase tracking-wider">
          Amount
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-xl">$</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder=""
            step="0.01"
            min="0"
            className="w-full bg-white/10 border border-white/20 rounded-xl px-12 py-4 text-white text-xl placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
            required
          />
        </div>
        <p className="text-gray-500 text-sm mt-2">Enter the amount you wish to send</p>
      </div>

      {paymentMethod === 'card' && (
        <div>
          <label className="block text-gray-400 text-sm font-medium mb-3 uppercase tracking-wider">
            Card Details
          </label>
          <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-4">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#ffffff',
                    '::placeholder': { color: '#9ca3af' },
                  },
                  invalid: { color: '#ef4444' },
                },
              }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
          <p className="text-green-400 text-sm">Payment initiated successfully!</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-white text-black font-medium py-4 px-6 rounded-xl hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
      >
        {loading ? 'Processing...' : 'Send Payment'}
      </button>
    </form>
  )
}

export default function PaymentForm(props: PaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormContent
        email={props.email}
        paymentMethod={props.paymentMethod ?? 'bank'}
        onPaymentComplete={props.onPaymentComplete}
        accountId={props.accountId}
      />
    </Elements>
  )
}
