'use client'

import { useState, useEffect } from 'react'
import PaymentForm from '@/components/PaymentForm'
import PaymentHistory from '@/components/PaymentHistory'
import PlaidLink from '@/components/PlaidLink'

interface BankAccount {
  id: string
  name: string
  mask: string
  type: string
  balance: number | null
}

export default function Home() {
  // Email step
  const [email, setEmail] = useState('')
  const [emailSubmitted, setEmailSubmitted] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)

  // Bank linking
  const [bankLinked, setBankLinked] = useState(false)
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')
  const [loadingAccounts, setLoadingAccounts] = useState(false)

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'card'>('bank')

  // OAuth redirect handling
  const [oauthRedirectUri, setOauthRedirectUri] = useState<string | null>(null)

  // Check for OAuth redirect on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('oauth_state_id')) {
        setOauthRedirectUri(window.location.href)
        // Restore email from localStorage for OAuth return
        const savedEmail = localStorage.getItem('pending_email')
        if (savedEmail) {
          setEmail(savedEmail)
          setEmailSubmitted(true)
        }
      }

      // Restore session if exists
      const savedEmail = localStorage.getItem('user_email')
      if (savedEmail) {
        setEmail(savedEmail)
        checkUserStatus(savedEmail)
      }
    }
  }, [])

  // Check if user exists and has bank linked
  const checkUserStatus = async (userEmail: string) => {
    setEmailLoading(true)
    try {
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      })
      const data = await res.json()

      setEmailSubmitted(true)
      localStorage.setItem('user_email', userEmail)

      if (data.hasBankLinked) {
        setBankLinked(true)
        if (data.selectedAccountId) {
          setSelectedAccountId(data.selectedAccountId)
        }
        await fetchAccounts(userEmail)
      }
    } catch (err) {
      console.error('Error checking user:', err)
    } finally {
      setEmailLoading(false)
    }
  }

  // Handle email form submission
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    // Save email for OAuth redirect
    localStorage.setItem('pending_email', email)
    await checkUserStatus(email)
  }

  // Fetch accounts from database
  const fetchAccounts = async (userEmail: string) => {
    setLoadingAccounts(true)
    try {
      const res = await fetch('/api/plaid/get-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      })
      const data = await res.json()

      if (data.accounts && data.accounts.length > 0) {
        setAccounts(data.accounts)
        if (!selectedAccountId) {
          setSelectedAccountId(data.accounts[0].id)
        }
      }
    } catch (err) {
      console.error('Error fetching accounts:', err)
    } finally {
      setLoadingAccounts(false)
    }
  }

  // Handle successful bank link
  const handleBankLinked = async () => {
    setBankLinked(true)
    localStorage.removeItem('pending_email')
    localStorage.removeItem('plaid_link_token')
    await fetchAccounts(email)
  }

  // Handle changing bank
  const handleChangeBank = async () => {
    try {
      await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, clear_plaid: true }),
      })
      localStorage.removeItem('plaid_link_token')
      setBankLinked(false)
      setAccounts([])
      setSelectedAccountId('')
    } catch (err) {
      console.error('Error clearing bank:', err)
    }
  }

  // Handle account selection change
  const handleAccountChange = async (accountId: string) => {
    setSelectedAccountId(accountId)
    try {
      await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, selected_account_id: accountId }),
      })
    } catch (err) {
      console.error('Error updating selected account:', err)
    }
  }

  // Handle changing email/logout
  const handleChangeEmail = () => {
    localStorage.removeItem('user_email')
    localStorage.removeItem('pending_email')
    localStorage.removeItem('plaid_link_token')
    setEmail('')
    setEmailSubmitted(false)
    setBankLinked(false)
    setAccounts([])
    setSelectedAccountId('')
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-light text-white mb-2">Payment Portal</h1>
          <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        </div>

        {/* Main Card */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-8 md:p-12">

              {/* Step 1: Email Input */}
              {!emailSubmitted ? (
                <div className="text-center py-8">
                  <h2 className="text-2xl font-light text-white mb-4">Welcome</h2>
                  <p className="text-gray-400 mb-8 max-w-md mx-auto">
                    Enter your email to get started or continue where you left off.
                  </p>
                  <form onSubmit={handleEmailSubmit} className="max-w-sm mx-auto">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all mb-4"
                    />
                    <button
                      type="submit"
                      disabled={emailLoading}
                      className="w-full bg-white text-black font-medium py-4 px-6 rounded-xl hover:bg-gray-100 transition-all disabled:opacity-50"
                    >
                      {emailLoading ? 'Loading...' : 'Continue'}
                    </button>
                  </form>
                </div>
              ) : !bankLinked && paymentMethod === 'bank' ? (
                /* Step 2: Bank Linking */
                <div className="text-center py-8">
                  <div className="flex justify-between items-center mb-8">
                    <span className="text-gray-400 text-sm">{email}</span>
                    <button
                      onClick={handleChangeEmail}
                      className="text-blue-400 text-sm hover:text-blue-300 transition-colors"
                    >
                      Change
                    </button>
                  </div>
                  <h2 className="text-2xl font-light text-white mb-4">Link Your Bank</h2>
                  <p className="text-gray-400 mb-8 max-w-md mx-auto">
                    Securely connect your bank account to make payments. This is a one-time setup.
                  </p>
                  <PlaidLink
                    email={email}
                    onSuccess={handleBankLinked}
                    receivedRedirectUri={oauthRedirectUri}
                  />
                  <div className="mt-6">
                    <button
                      onClick={() => setPaymentMethod('card')}
                      className="text-gray-400 text-sm hover:text-white transition-colors"
                    >
                      Or pay with credit card instead
                    </button>
                  </div>
                </div>
              ) : (
                /* Step 3: Payment Form */
                <>
                  <div className="flex justify-between items-center mb-8">
                    <span className="text-gray-400 text-sm">{email}</span>
                    <button
                      onClick={handleChangeEmail}
                      className="text-blue-400 text-sm hover:text-blue-300 transition-colors"
                    >
                      Switch Account
                    </button>
                  </div>

                  <h2 className="text-2xl font-light text-white mb-8">Send Payment</h2>

                  {/* Payment Method Toggle */}
                  <div className="mb-8">
                    <div className="flex gap-4 p-1 bg-white/5 rounded-lg">
                      <button
                        onClick={() => setPaymentMethod('bank')}
                        className={`flex-1 py-3 px-4 rounded-md transition-all ${
                          paymentMethod === 'bank'
                            ? 'bg-white text-black font-medium'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        🏦 Bank (0.8% fee)
                      </button>
                      <button
                        onClick={() => setPaymentMethod('card')}
                        className={`flex-1 py-3 px-4 rounded-md transition-all ${
                          paymentMethod === 'card'
                            ? 'bg-white text-black font-medium'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        💳 Card (2.9% + $0.30)
                      </button>
                    </div>
                  </div>

                  {/* Link Bank if needed */}
                  {paymentMethod === 'bank' && !bankLinked && (
                    <div className="mb-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-blue-400 text-sm mb-4">Link your bank account to pay with ACH</p>
                      <PlaidLink
                        email={email}
                        onSuccess={handleBankLinked}
                        receivedRedirectUri={oauthRedirectUri}
                      />
                    </div>
                  )}

                  {/* Account Selector */}
                  {paymentMethod === 'bank' && bankLinked && accounts.length > 0 && (
                    <div className="mb-8 p-4 bg-white/5 border border-white/10 rounded-lg">
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-gray-400 text-sm font-medium uppercase tracking-wider">
                          Pay From
                        </label>
                        <button
                          onClick={handleChangeBank}
                          className="text-blue-400 text-sm hover:text-blue-300 transition-colors"
                        >
                          Change Bank
                        </button>
                      </div>
                      <select
                        value={selectedAccountId}
                        onChange={(e) => handleAccountChange(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                      >
                        {accounts.map((account) => (
                          <option key={account.id} value={account.id} className="bg-gray-900">
                            {account.name} (****{account.mask}) - {account.type}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Loading accounts */}
                  {paymentMethod === 'bank' && bankLinked && loadingAccounts && (
                    <div className="mb-8 p-4 bg-white/5 border border-white/10 rounded-lg">
                      <p className="text-gray-400 text-sm">Loading accounts...</p>
                    </div>
                  )}

                  <PaymentForm
                    email={email}
                    paymentMethod={paymentMethod}
                    accountId={selectedAccountId}
                  />
                </>
              )}
            </div>
          </div>

          {emailSubmitted && <PaymentHistory email={email} />}

          <div className="text-center mt-8 text-gray-500 text-sm">
            Secured by Plaid & Stripe • All transactions encrypted
          </div>
        </div>
      </div>
    </main>
  )
}
