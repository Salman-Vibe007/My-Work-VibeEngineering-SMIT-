'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Input } from '@prelegal/ui'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError('')
    setMessage('')
    try {
      const response = await fetch('/api/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const result = await response.json()
      if (!response.ok) {
        setError(result.error || 'Unable to request a password reset.')
        return
      }
      setMessage(result.message)
    } catch {
      setError('Unable to reach the server. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="mb-6 inline-block text-2xl font-bold text-primary-600">PreLegal</Link>
          <CardTitle>Forgot your password?</CardTitle>
          <CardDescription>Enter your account email and we’ll send a secure reset link.</CardDescription>
        </CardHeader>
        <CardContent>
          {message && <p role="status" className="mb-4 rounded-lg bg-success-50 p-4 text-sm text-success-700">{message}</p>}
          {error && <p role="alert" className="mb-4 rounded-lg bg-error-50 p-4 text-sm text-error-600">{error}</p>}
          <form onSubmit={submit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isLoading}
            />
            <Button type="submit" className="w-full" loading={isLoading}>Send reset link</Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <Link href="/signin" className="text-sm text-primary-600 hover:underline">Back to sign in</Link>
        </CardFooter>
      </Card>
    </main>
  )
}
