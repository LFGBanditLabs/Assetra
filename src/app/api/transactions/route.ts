import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createTransactionSchema, transactionQuerySchema } from '@/lib/validations/transaction';
import { handleApiError } from '@/lib/utils/apiError';
import { logger } from '@/lib/utils/logger';
import { rateLimit } from '@/lib/middleware/rateLimit';
import { resolveRequestUser } from '@/lib/utils/requestUser';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = transactionQuerySchema.parse(Object.fromEntries(searchParams));

    const { page, limit, type, status } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              walletAddress: true,
            },
          },
          asset: {
            select: {
              id: true,
              name: true,
              tokenId: true,
            },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit()(req);
    if (rateLimitResult) return rateLimitResult;

    const body = await req.json();
    const data = createTransactionSchema.parse(body);

    const user = await resolveRequestUser(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const transaction = await prisma.transaction.create({
      data: {
        ...data,
        userId: user.id,
      },
    });

    logger.info('Transaction created', { txHash: transaction.txHash, userId: user.id });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
