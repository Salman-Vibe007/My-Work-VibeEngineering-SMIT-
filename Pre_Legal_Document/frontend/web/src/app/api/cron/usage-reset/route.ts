import { NextResponse } from 'next/server'
import { prisma } from '@prelegal/database'

async function resetUsage(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET
    const authHeader = request.headers.get('authorization')
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Invalid cron secret' }, { status: 401 })
    }

    const now = new Date()
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    await prisma.usageRecord.deleteMany({
      where: {
        periodEnd: {
          lt: periodStart,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Usage records cleaned up',
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error('Usage reset failed:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const GET = resetUsage
export const POST = resetUsage