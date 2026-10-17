'use client'

import { useEffect, useState } from 'react'
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@prelegal/ui'
import { JURISDICTIONS } from '@prelegal/shared'

interface Profile {
  email: string
  name: string | null
  locale: string
  preferredJurisdiction: string | null
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [name, setName] = useState('')
  const [locale, setLocale] = useState('en')
  const [jurisdiction, setJurisdiction] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/account')
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Unable to load your profile.')
        setProfile(result.user)
        setName(result.user.name || '')
        setLocale(result.user.locale)
        setJurisdiction(result.user.preferredJurisdiction || '')
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Unable to load your profile.'))
      .finally(() => setLoading(false))
  }, [])

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const response = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          locale,
          preferredJurisdiction: jurisdiction || null,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to save your profile.')
      setProfile(result.user)
      setMessage('Profile saved.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save your profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p aria-live="polite" className="text-text-secondary">Loading settings…</p>
  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <header><h1 className="text-3xl font-bold text-text-primary">Settings</h1><p className="mt-1 text-text-secondary">Manage your profile and preferred jurisdiction.</p></header>
      {error && <p role="alert" className="rounded-lg bg-error-50 p-4 text-sm text-error-600">{error}</p>}
      {message && <p role="status" className="rounded-lg bg-success-50 p-4 text-sm text-success-700">{message}</p>}
      <Card><CardHeader><CardTitle>Profile</CardTitle></CardHeader><CardContent>
        <form onSubmit={save} className="space-y-5">
          <Input label="Email" value={profile?.email ?? ''} disabled />
          <Input label="Name" required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} />
          <Input label="Language (2-letter code)" required minLength={2} maxLength={2} value={locale} onChange={(event) => setLocale(event.target.value)} />
          <div>
            <label htmlFor="preferred-jurisdiction" className="mb-1.5 block text-sm font-medium text-text-primary">Preferred jurisdiction</label>
            <select
              id="preferred-jurisdiction"
              className="h-10 w-full rounded-lg border border-border-medium bg-background-secondary px-3 text-sm text-text-primary"
              value={jurisdiction}
              onChange={(event) => setJurisdiction(event.target.value)}
            >
              <option value="">No preference</option>
              {JURISDICTIONS.filter((item) => !item.region).map((item) => (
                <option key={item.country} value={item.country}>{item.displayName}</option>
              ))}
            </select>
          </div>
          <Button type="submit" loading={saving}>Save settings</Button>
        </form>
      </CardContent></Card>
    </section>
  )
}
