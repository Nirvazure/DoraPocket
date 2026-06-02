import 'server-only'

import { SUBMISSION_DEDUP_SIMILARITY_THRESHOLD } from '@/constant'
import { prisma } from '@/server/db/prisma'
import { createImportedToolId } from '@/server/repositories/tool-repo'
import { embedQuery, searchToolsByEmbedding } from '@/server/retrieval/tool-embedding'

export function buildSubmissionEmbeddingText(input: {
  name: string
  description: string
  tags: string[]
}): string {
  return [input.name, input.description, `标签: ${input.tags.join('、')}`].join('\n')
}

export async function dedupMarketSubmission(
  submissionId: string,
): Promise<'duplicate' | 'unique' | 'skipped'> {
  const submission = await prisma.marketSubmission.findUnique({
    where: { id: submissionId },
  })
  if (!submission || submission.dedupCheckedAt) return 'skipped'

  const urlToolId = createImportedToolId(submission.url)
  const embedding = await embedQuery(
    buildSubmissionEmbeddingText({
      name: submission.name,
      description: submission.description,
      tags: submission.tags,
    }),
  )

  if (!embedding) {
    await prisma.marketSubmission.update({
      where: { id: submissionId },
      data: { dedupCheckedAt: new Date() },
    })
    return 'skipped'
  }

  const matches = await searchToolsByEmbedding(embedding, 1)
  const threshold = SUBMISSION_DEDUP_SIMILARITY_THRESHOLD
  const topMatch = [...matches.entries()][0]

  if (!topMatch || topMatch[1] < threshold || topMatch[0] === (submission.toolId ?? urlToolId)) {
    await prisma.marketSubmission.update({
      where: { id: submissionId },
      data: {
        dedupCheckedAt: new Date(),
        toolId: submission.toolId ?? urlToolId,
      },
    })
    return 'unique'
  }

  await prisma.marketSubmission.update({
    where: { id: submissionId },
    data: {
      toolId: topMatch[0],
      status: 'duplicate',
      duplicateSimilarity: topMatch[1],
      dedupCheckedAt: new Date(),
    },
  })
  return 'duplicate'
}

export type DedupSubmissionsResult = {
  scanned: number
  duplicates: number
  unique: number
  skipped: number
  errors: number
}

export async function dedupPendingSubmissions(batchSize: number): Promise<DedupSubmissionsResult> {
  const result: DedupSubmissionsResult = {
    scanned: 0,
    duplicates: 0,
    unique: 0,
    skipped: 0,
    errors: 0,
  }

  const submissions = await prisma.marketSubmission.findMany({
    where: {
      dedupCheckedAt: null,
      status: 'review',
    },
    select: { id: true },
    orderBy: { submittedAt: 'asc' },
    take: batchSize,
  })

  for (const submission of submissions) {
    result.scanned += 1
    try {
      const outcome = await dedupMarketSubmission(submission.id)
      if (outcome === 'duplicate') result.duplicates += 1
      else if (outcome === 'unique') result.unique += 1
      else result.skipped += 1
    } catch (error) {
      result.errors += 1
      console.error('[dedupPendingSubmissions]', submission.id, error)
    }
  }

  return result
}
