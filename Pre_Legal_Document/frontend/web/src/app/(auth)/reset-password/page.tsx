'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Input } from '@prelegal/ui'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-neutral-50" aria-busy="true" />}>
      <ResetPasswordForm />
    </Suspense>
  )
}

function ResetPasswordForm() {
  const router = useRouter()
  const token = useSearchParams().get('token') || ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError('')
    try {
      const response = await fetch('/api/auth/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
      })
      const result = await response.json()
      if (!response.ok) {
        setError(result.error || 'Unable to reset password.')
        return
      }
      router.push('/signin?passwordReset=true')
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
          <CardTitle>Choose a new password</CardTitle>
          <CardDescription>Use at least 8 characters for your new password.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p role="alert" className="mb-4 rounded-lg bg-error-50 p-4 text-sm text-error-600">{error}</p>}
          {!token && <p role="alert" className="mb-4 text-sm text-error-600">This reset link is missing its token. Request a new link.</p>}
          <form onSubmit={submit} className="space-y-4">
            <Input
              label="New password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isLoading || !token}
            />
            <Input
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              disabled={isLoading || !token}
            />
            <Button type="submit" className="w-full" loading={isLoading} disabled={!token}>Update password</Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <Link href="/forgot-password" className="text-sm text-primary-600 hover:underline">Request another reset link</Link>
        </CardFooter>
      </Card>
    </main>
  )
}
