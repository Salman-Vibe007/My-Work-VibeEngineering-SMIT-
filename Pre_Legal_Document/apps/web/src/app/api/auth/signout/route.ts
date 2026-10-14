import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST() {
  const session = await auth()
  
  if (session) {
    await auth.api.signOut()
  }

  return NextResponse.json({ success: true })
}