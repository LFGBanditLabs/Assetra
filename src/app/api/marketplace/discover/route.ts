import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { resolveRequestUser } from '@/lib/utils/requestUser';

// Marketplace discovery API with advanced filtering
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Extract query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search');
    const assetType = searchParams.get('assetType')?.split(',');
    const status = searchParams.get('status')?.split(',');
    const location = searchParams.get('location')?.split(',');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const minYield = searchParams.get('minYield');
    const maxYield = searchParams.get('maxYield');
    const riskRating = searchParams.get('riskRating')?.split(',');
    const verificationStatus = searchParams.get('verificationStatus')?.split(',');
    const sortBy = searchParams.get('sortBy') || 'CREATED_AT';
    const sortOrder = searchParams.get('sortOrder') || 'DESC';
    const viewType = searchParams.get('viewType') || 'GRID';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, any> = {
      status: { in: ['ACTIVE', 'VERIFIED'] }
    };

    if (assetType && assetType.length > 0) {
      where.assetType = { in: assetType };
    }

    if (location && location.length > 0) {
      where.location = { in: location };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Add price filtering (using assetValue as base price)
    if (minPrice || maxPrice) {
      where.assetValue = {};
      if (minPrice) where.assetValue.gte = parseFloat(minPrice);
      if (maxPrice) where.assetValue.lte = parseFloat(maxPrice);
    }

    // Build orderBy clause
    const orderBy: Record<string, any> = {};
    switch (sortBy) {
      case 'PRICE':
        orderBy.assetValue = sortOrder.toLowerCase();
        break;
      case 'MARKET_CAP':
        orderBy.assetValue = sortOrder.toLowerCase();
        break;
      case 'CREATED_AT':
        orderBy.createdAt = sortOrder.toLowerCase();
        break;
      default:
        orderBy.createdAt = 'desc';
    }

    // Execute query
    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          owner: {
            select: {
              id: true,
              walletAddress: true,
              kycStatus: true,
            },
          },
          shares: {
            select: {
              id: true,
              amount: true,
              purchasePrice: true,
              currentValue: true,
            },
          },
          transactions: {
            where: {
              type: { in: ['PURCHASE', 'SALE'] },
              status: 'CONFIRMED',
            },
            orderBy: {
              timestamp: 'desc',
            },
            take: 100, // Limit for performance
          },
          _count: {
            select: {
              shares: true,
              transactions: true,
            },
          },
        },
      }),
      prisma.asset.count({ where }),
    ]);

    // Transform assets for marketplace display
    const transformedAssets = assets.map((asset: any) => {
      const totalVolume = asset.transactions.reduce((sum: number, tx: any) => {
        return sum + parseFloat(tx.amount.toString());
      }, 0);

      const recentTransactions = asset.transactions.slice(0, 10);
      const averagePrice = recentTransactions.length > 0 
        ? recentTransactions.reduce((sum: number, tx: any) => sum + parseFloat(tx.amount.toString()), 0) / recentTransactions.length
        : parseFloat(asset.assetValue.toString()) / asset.totalShares;

      return {
        ...asset,
        pricePerShare: averagePrice.toString(),
        marketCap: asset.assetValue.toString(),
        volume24h: totalVolume.toString(),
        priceChange24h: '0', // Would be calculated from price history
        yieldPotential: (Math.random() * 15 + 2).toFixed(2), // Mock data for now
        isVerified: asset.status === 'VERIFIED',
        verificationDate: asset.verifiedAt,
        riskRating: ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)],
        shareCount: asset._count.shares,
        transactionCount: asset._count.transactions,
      };
    });

    return NextResponse.json({
      assets: transformedAssets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filters: {
        assetType: assetType || [],
        status: status || [],
        location: location || [],
        minPrice: minPrice ? parseFloat(minPrice) : null,
        maxPrice: maxPrice ? parseFloat(maxPrice) : null,
        minYield: minYield ? parseFloat(minYield) : null,
        maxYield: maxYield ? parseFloat(maxYield) : null,
        riskRating: riskRating || [],
        verificationStatus: verificationStatus || [],
        sortBy,
        sortOrder,
        viewType,
      },
    });
  } catch (error) {
    console.error('Marketplace discovery error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get featured/trending assets
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, limit = 10 } = body;

    const orderBy: Record<string, any> = {};
    const where: Record<string, any> = {
      status: { in: ['ACTIVE', 'VERIFIED'] }
    };

    switch (type) {
      case 'featured':
        // Featured assets (newly verified or high value)
        orderBy.verifiedAt = 'desc';
        where.verifiedAt = { not: null };
        break;
      case 'trending':
        // Trending based on recent transaction volume
        orderBy.updatedAt = 'desc';
        // Would need to implement transaction volume calculation
        break;
      case 'high_yield':
        // Mock high yield assets
        orderBy.assetValue = 'desc';
        break;
      default:
        orderBy.createdAt = 'desc';
    }

    const assets = await prisma.asset.findMany({
      where,
      take: limit,
      orderBy,
      include: {
        owner: {
          select: {
            id: true,
            walletAddress: true,
            kycStatus: true,
          },
        },
        _count: {
          select: {
            shares: true,
            transactions: true,
          },
        },
      },
    });

    const transformedAssets = assets.map((asset: any) => ({
      ...asset,
      pricePerShare: (parseFloat(asset.assetValue.toString()) / asset.totalShares).toString(),
      marketCap: asset.assetValue.toString(),
      volume24h: '0',
      priceChange24h: '0',
      yieldPotential: (Math.random() * 15 + 2).toFixed(2),
      isVerified: asset.status === 'VERIFIED',
      verificationDate: asset.verifiedAt,
      riskRating: ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)],
      shareCount: asset._count.shares,
      transactionCount: asset._count.transactions,
    }));

    return NextResponse.json({
      assets: transformedAssets,
      type,
    });
  } catch (error) {
    console.error('Featured assets error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}