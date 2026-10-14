import { NextResponse } from 'next/server'
import { prisma } from '@prelegal/database'
import { auth } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'administrator') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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