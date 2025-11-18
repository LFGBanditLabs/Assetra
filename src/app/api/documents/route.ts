import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createDocumentSchema, documentQuerySchema } from '@/lib/validations/document'
import { handleApiError } from '@/lib/utils/apiError'
import { logger } from '@/lib/utils/logger'
import { resolveRequestUser } from '@/lib/utils/requestUser'

const ADMIN_TOKEN = process.env.ADMIN_API_TOKEN

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = documentQuerySchema.parse(Object.fromEntries(searchParams))

    const { page, limit, assetId, type } = query
    const skip = (page - 1) * limit

    const adminToken = req.headers.get('x-admin-token')
    const isAdmin = ADMIN_TOKEN && adminToken === ADMIN_TOKEN

    const where: any = {}

    if (!isAdmin) {
      const user = await resolveRequestUser(req)
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      where.userId = user.id
    }

    if (assetId) where.assetId = assetId
    if (type) where.type = type

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ uploadedAt: 'desc' }, { version: 'desc' }],
      }),
      prisma.document.count({ where }),
    ])

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await resolveRequestUser(req)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const data = createDocumentSchema.parse(body)

    const latestVersion = await prisma.document.findFirst({
      where: {
        userId: user.id,
        assetId: data.assetId ?? undefined,
        type: data.type,
      },
      orderBy: { version: 'desc' },
    })

    const document = await prisma.document.create({
      data: {
        ...data,
        version: data.version ?? (latestVersion ? latestVersion.version + 1 : 1),
        userId: user.id,
      },
    })

    logger.info('Document stored', {
      documentId: document.id,
      assetId: document.assetId,
      type: document.type,
    })

    return NextResponse.json({ document }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

