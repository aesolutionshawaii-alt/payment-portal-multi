'use client'

import { usePlaidLink } from 'react-plaid-link'
import { useEffect, useState } from 'react'

interface PlaidLinkProps {
  email: string
  onSuccess: () => void
  receivedRedirectUri?: string | null
}

export default function PlaidLink({ email, onSuccess, receivedRedirectUri }: PlaidLinkProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null)

  useEffect(() => {
    // If returning from OAuth, reuse the stored link token
    if (receivedRedirectUri) {
      const storedToken = localStorage.getItem('plaid_link_token')
      if (storedToken) {
        setLinkToken(storedToken)
        return
      }
    }

    // Otherwise, create a new link token
    fetch('/api/plaid/create-link-token')
      .then(res => res.json())
      .then(data => {
        // Store the link token for potential OAuth redirect
        localStorage.setItem('plaid_link_token', data.link_token)
        setLinkToken(data.link_token)
      })
  }, [receivedRedirectUri])

  const { open, ready } = usePlaidLink({
    token: linkToken,
    receivedRedirectUri: receivedRedirectUri || undefined,
    onSuccess: (public_token) => {
      fetch('/api/plaid/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_token, email })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            // Clean up the stored link token
            localStorage.removeItem('plaid_link_token')
            onSuccess()
          } else {
            console.error('Token exchange failed:', data.error)
            alert('Failed to link bank account. Please try again.')
          }
        })
        .catch(err => {
          console.error('Token exchange error:', err)
          alert('Failed to link bank account. Please try again.')
        })
    },
  })

  // Auto-open Plaid Link when returning from OAuth redirect
  useEffect(() => {
    if (receivedRedirectUri && ready) {
      open()
    }
  }, [receivedRedirectUri, ready, open])

  return (
    <button
      onClick={() => open()}
      disabled={!ready}
      className="group relative px-12 py-4 bg-white text-black font-semibold rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-white opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <span className="relative flex items-center gap-3">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Link Bank Account
      </span>
    </button>
  )
}
