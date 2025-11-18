import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { updateDocumentSchema } from '@/lib/validations/document'
import { handleApiError } from '@/lib/utils/apiError'
import { resolveRequestUser } from '@/lib/utils/requestUser'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const document = await prisma.document.findUnique({
      where: { id: params.id },
    })

    if (!document) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ document })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await resolveRequestUser(req)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const data = updateDocumentSchema.parse(body)

    const existing = await prisma.document.findUnique({
      where: { id: params.id },
    })

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const document = await prisma.document.update({
      where: { id: params.id },
      data,
    })

    return NextResponse.json({ document })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await resolveRequestUser(req)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existing = await prisma.document.findUnique({
      where: { id: params.id },
    })

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.document.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}

