import { NextResponse } from 'next/server'
import { prisma } from '@prelegal/database'

async function cleanupExpiredShares(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET
    const authHeader = request.headers.get('authorization')
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Invalid cron secret' }, { status: 401 })
    }

    const expiredShares = await prisma.documentShare.updateMany({
      where: {
        isRevoked: false,
        expiresAt: {
          lt: new Date(),
        },
      },
      data: {
        isRevoked: true,
      },
    })

    return NextResponse.json({
      success: true,
      revokedCount: expiredShares.count,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Cleanup expired shares failed:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = cleanupExpiredShares
export const POST = cleanupExpiredShares