import { Worker } from 'bullmq'
import IORedis from 'ioredis'
import { prisma } from '@prelegal/database'
import { processGenerationJob } from './generation'

const queueName = 'document-generation'

export function startWorker() {
  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) {
    throw new Error('REDIS_URL must be configured to start the document worker')
  }

  const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null })
  const worker = new Worker<{ generationJobId: string }, unknown>(
    queueName,
    async (job) => {
      if (!job.data?.generationJobId) {
        throw new Error('Queue message must include a generationJobId')
      }
      const output = await processGenerationJob(job.data.generationJobId)
      return { fileName: output.fileName, mimeType: output.mimeType }
    },
    { connection, concurrency: 2 }
  )

  worker.on('failed', (job, error) => {
    console.error(`Document generation job ${job?.id ?? 'unknown'} failed:`, error)
  })

  const shutdown = async () => {
    await worker.close()
    await connection.quit()
    await prisma.$disconnect()
  }
  process.once('SIGINT', () => void shutdown())
  process.once('SIGTERM', () => void shutdown())

  return worker
}

startWorker()
