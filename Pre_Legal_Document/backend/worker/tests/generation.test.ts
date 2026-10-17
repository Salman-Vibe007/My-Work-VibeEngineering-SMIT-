import { beforeEach, describe, expect, it, vi } from 'vitest'
import { JobType } from '@prisma/client'
import { prisma } from '@prelegal/database'
import { processGenerationJob } from '../src/generation'

vi.mock('@prelegal/database', () => ({
  prisma: {
    generationJob: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

const input = {
  title: 'Notice',
  renderResult: {
    sections: [{ id: 'body', title: 'Body', content: 'A draft notice.', order: 0 }],
    fullContent: 'A draft notice.',
    missingFields: [],
    warnings: [],
  },
}

function generationJob(type: JobType, jobInput: unknown = input) {
  return {
    id: 'job-1',
    type,
    input: jobInput,
  }
}

describe('processGenerationJob', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.generationJob.update).mockResolvedValue({} as never)
  })

  it('renders and persists PDF output', async () => {
    vi.mocked(prisma.generationJob.findUnique).mockResolvedValue(
      generationJob(JobType.PDF_GENERATION) as never
    )

    const result = await processGenerationJob('job-1')

    expect(result.fileName).toBe('Notice.pdf')
    expect(result.mimeType).toBe('application/pdf')
    expect(Buffer.from(result.data, 'base64').subarray(0, 4).toString()).toBe('%PDF')
    expect(prisma.generationJob.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'COMPLETED', output: result }),
      })
    )
  })

  it('renders and persists DOCX output', async () => {
    vi.mocked(prisma.generationJob.findUnique).mockResolvedValue(
      generationJob(JobType.DOCX_GENERATION) as never
    )

    const result = await processGenerationJob('job-1')

    expect(result.fileName).toBe('Notice.docx')
    expect(result.mimeType).toContain('officedocument.wordprocessingml.document')
    expect(Array.from(Buffer.from(result.data, 'base64').subarray(0, 2))).toEqual([0x50, 0x4b])
  })

  it('marks invalid payloads failed and surfaces the error', async () => {
    vi.mocked(prisma.generationJob.findUnique).mockResolvedValue(
      generationJob(JobType.PDF_GENERATION, { title: '', renderResult: {} }) as never
    )

    await expect(processGenerationJob('job-1')).rejects.toThrow('Invalid generation job input')
    expect(prisma.generationJob.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'FAILED' }),
      })
    )
  })

  it('rejects unsupported job types and records failure', async () => {
    vi.mocked(prisma.generationJob.findUnique).mockResolvedValue(
      generationJob(JobType.AI_SUGGESTION) as never
    )

    await expect(processGenerationJob('job-1')).rejects.toThrow(
      'Unsupported generation job type: AI_SUGGESTION'
    )
    expect(prisma.generationJob.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'FAILED' }),
      })
    )
  })

  it('fails clearly when the job does not exist', async () => {
    vi.mocked(prisma.generationJob.findUnique).mockResolvedValue(null)

    await expect(processGenerationJob('missing')).rejects.toThrow(
      'Generation job "missing" was not found'
    )
    expect(prisma.generationJob.update).not.toHaveBeenCalled()
  })
})
