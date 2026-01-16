'use client'

import { useEffect, useState } from 'react'

interface Payment {
  id: string
  amount: number
  date: string
  status: string
}

interface PaymentHistoryProps {
  email: string
}

export default function PaymentHistory({ email }: PaymentHistoryProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!email) {
      setLoading(false)
      return
    }

    fetch(`/api/payment/history?email=${encodeURIComponent(email)}`)
      .then(res => res.json())
      .then(data => {
        setPayments(data.payments || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [email])

  if (loading) {
    return (
      <div className="mt-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
        <div className="text-center text-gray-500 py-8">
          <svg className="animate-spin h-6 w-6 mx-auto" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    )
  }

  if (payments.length === 0) {
    return (
      <div className="mt-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
        <div className="text-center text-gray-500 py-8">
          <svg className="w-12 h-12 mx-auto mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm">No payment history yet</p>
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="mt-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-light text-white">Payment History</h2>
        <div className="text-right">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total Paid</p>
          <p className="text-2xl font-light text-white">{formatAmount(totalPaid)}</p>
        </div>
      </div>

      <div className="space-y-3">
        {payments.map((payment) => (
          <div
            key={payment.id}
            className="flex justify-between items-center p-5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
          >
            <div>
              <div className="font-semibold text-white text-lg">{formatAmount(payment.amount)}</div>
              <div className="text-sm text-gray-500">{formatDate(payment.date)}</div>
            </div>
            <div className="flex items-center gap-2">
              {payment.status === 'completed' || payment.status === 'succeeded' ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-400 font-medium">Completed</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-yellow-400 font-medium">Pending</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
