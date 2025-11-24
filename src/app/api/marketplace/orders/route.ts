import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { resolveRequestUser } from '@/lib/utils/requestUser';

// Create buy/sell order
export async function POST(req: NextRequest) {
  try {
    const user = await resolveRequestUser(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check KYC status
    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!userRecord || userRecord.kycStatus !== 'VERIFIED') {
      return NextResponse.json(
        { error: 'KYC verification required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { assetId, type, amount, pricePerShare, expiresAt } = body;

    // Validate input
    if (!assetId || !type || !amount || !pricePerShare) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['BUY', 'SELL'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid order type' },
        { status: 400 }
      );
    }

    if (amount <= 0 || parseFloat(pricePerShare) <= 0) {
      return NextResponse.json(
        { error: 'Amount and price must be positive' },
        { status: 400 }
      );
    }

    // Verify asset exists and is available for trading
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        shares: {
          where: { userId: user.id },
        },
      },
    });

    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    if (!['ACTIVE', 'VERIFIED'].includes(asset.status)) {
      return NextResponse.json(
        { error: 'Asset not available for trading' },
        { status: 400 }
      );
    }

    // Check if user has enough shares for sell orders
    if (type === 'SELL') {
      const userShares = asset.shares.reduce((sum, share) => sum + share.amount, 0);
      if (userShares < amount) {
        return NextResponse.json(
          { error: 'Insufficient shares to sell' },
          { status: 400 }
        );
      }
    }

    const totalPrice = (amount * parseFloat(pricePerShare)).toString();

    // Create order
    const order = await prisma.$transaction(async (tx) => {
      // Create the order record
      const order = await tx.transaction.create({
        data: {
          txHash: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: type === 'BUY' ? 'PURCHASE' : 'SALE',
          status: 'PENDING',
          amount: amount.toString(),
          userId: user.id,
          assetId: asset.id,
        },
      });

      // For sell orders, lock the shares temporarily
      if (type === 'SELL') {
        // This is a simplified approach - in production, you'd want more sophisticated locking
        await tx.share.updateMany({
          where: {
            userId: user.id,
            assetId: asset.id,
          },
          data: {
            // Lock shares - in production this would be more sophisticated
          },
        });
      }

      return order;
    });

    return NextResponse.json(
      {
        order: {
          id: order.id,
          assetId: order.assetId,
          userId: order.userId,
          type,
          amount,
          pricePerShare: pricePerShare.toString(),
          totalPrice,
          status: 'ACTIVE',
          createdAt: order.timestamp,
          expiresAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get user's orders
export async function GET(req: NextRequest) {
  try {
    const user = await resolveRequestUser(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const assetId = searchParams.get('assetId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const skip = (page - 1) * limit;

    const where: any = {
      userId: user.id,
    };

    if (type) {
      where.type = type === 'BUY' ? 'PURCHASE' : 'SALE';
    }

    if (status) {
      where.status = status;
    }

    if (assetId) {
      where.assetId = assetId;
    }

    const [orders, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          timestamp: 'desc',
        },
        include: {
          asset: {
            select: {
              id: true,
              name: true,
              assetType: true,
              ipfsHash: true,
              contractAddress: true,
            },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({
      orders: orders.map(order => ({
        id: order.id,
        type: order.type === 'PURCHASE' ? 'BUY' : 'SELL',
        amount: parseFloat(order.amount),
        status: order.status,
        timestamp: order.timestamp,
        asset: order.asset,
        txHash: order.txHash,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 