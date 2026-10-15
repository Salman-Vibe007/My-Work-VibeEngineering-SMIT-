import PDFDocument from 'pdfkit'
import { z } from 'zod'
import { prisma } from '@prelegal/database'
import { DocumentEngine } from '@prelegal/document-engine'
import { JobType } from '@prisma/client'

const generationInputSchema = z.object({
  title: z.string().min(1).max(200),
  renderResult: z.object({
    sections: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        content: z.string(),
        order: z.number().int(),
      })
    ),
    fullContent: z.string(),
    missingFields: z.array(z.string()),
    warnings: z.array(z.string()),
  }),
})

export type GenerationInput = z.infer<typeof generationInputSchema>

export interface GeneratedExport {
  fileName: string
  mimeType: string
  data: string
}

export async function processGenerationJob(jobId: string): Promise<GeneratedExport> {
  const job = await prisma.generationJob.findUnique({ where: { id: jobId } })
  if (!job) {
    throw new Error(`Generation job "${jobId}" was not found`)
  }

  await prisma.generationJob.update({
    where: { id: jobId },
    data: {
      status: 'PROCESSING',
      startedAt: new Date(),
      attempts: { increment: 1 },
      error: null,
    },
  })

  try {
    if (job.type !== JobType.PDF_GENERATION && job.type !== JobType.DOCX_GENERATION) {
      throw new Error(`Unsupported generation job type: ${job.type}`)
    }

    const parsedInput = generationInputSchema.safeParse(job.input)
    if (!parsedInput.success) {
      throw new Error(`Invalid generation job input: ${parsedInput.error.message}`)
    }

    const { title, renderResult } = parsedInput.data
    const isPdf = job.type === JobType.PDF_GENERATION
    const bytes = isPdf
      ? await generatePdf(title, renderResult.sections)
      : await new DocumentEngine().generateDOCX({ title, renderResult })
    const output: GeneratedExport = {
      fileName: `${title}.${isPdf ? 'pdf' : 'docx'}`,
      mimeType: isPdf
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      data: Buffer.from(bytes).toString('base64'),
    }

    await prisma.generationJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        output: {
          fileName: output.fileName,
          mimeType: output.mimeType,
          data: output.data,
        },
        error: null,
        completedAt: new Date(),
      },
    })

    return output
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown generation error'
    await prisma.generationJob.update({
      where: { id: jobId },
      data: { status: 'FAILED', error: message, completedAt: new Date() },
    })
    throw error
  }
}

function generatePdf(
  title: string,
  sections: GenerationInput['renderResult']['sections']
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const document = new PDFDocument({ size: 'LETTER', margin: 72 })
    const chunks: Buffer[] = []

    document.on('data', (chunk: Buffer) => chunks.push(chunk))
    document.on('end', () => resolve(Buffer.concat(chunks)))
    document.on('error', reject)

    document.fontSize(20).text(title, { align: 'center' })
    document.moveDown()

    for (const section of sections) {
      document.fontSize(14).text(section.title, { underline: true })
      document.moveDown(0.5)
      document.fontSize(11).text(section.content)
      document.moveDown()
    }

    document.end()
  })
}
