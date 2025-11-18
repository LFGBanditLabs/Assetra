import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { handleApiError } from '@/lib/utils/apiError';
import { logger } from '@/lib/utils/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { event, data } = body;

    logger.info('Blockchain webhook received', { event, data });

    switch (event) {
      case 'AssetMinted':
        await handleAssetMinted(data);
        break;
      case 'AssetTransferred':
        await handleAssetTransferred(data);
        break;
      case 'SharesPurchased':
        await handleSharesPurchased(data);
        break;
      case 'TransactionConfirmed':
        await handleTransactionConfirmed(data);
        break;
      default:
        logger.warn('Unknown blockchain event', { event });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

async function handleAssetMinted(data: any) {
  const { tokenId, contractAddress, owner, txHash } = data;

  await prisma.asset.updateMany({
    where: {
      owner: { walletAddress: owner },
      status: 'PENDING',
    },
    data: {
      tokenId: parseInt(tokenId),
      contractAddress,
      status: 'ACTIVE',
    },
  });

  logger.info('Asset minted', { tokenId, owner });
}

async function handleAssetTransferred(data: any) {
  const { tokenId, from, to, txHash } = data;

  const asset = await prisma.asset.findUnique({
    where: { tokenId: parseInt(tokenId) },
  });

  if (asset) {
    const newOwner = await prisma.user.findUnique({
      where: { walletAddress: to },
    });

    if (newOwner) {
      await prisma.asset.update({
        where: { id: asset.id },
        data: { ownerId: newOwner.id },
      });
    }
  }

  logger.info('Asset transferred', { tokenId, from, to });
}

async function handleSharesPurchased(data: any) {
  const { assetId, buyer, amount, price, txHash } = data;

  const asset = await prisma.asset.findFirst({
    where: { tokenId: parseInt(assetId) },
  });

  const user = await prisma.user.findUnique({
    where: { walletAddress: buyer },
  });

  if (asset && user) {
    await prisma.share.create({
      data: {
        amount: parseInt(amount),
        purchasePrice: parseFloat(price),
        currentValue: parseFloat(price),
        userId: user.id,
        assetId: asset.id,
      },
    });

    await prisma.asset.update({
      where: { id: asset.id },
      data: {
        availableShares: {
          decrement: parseInt(amount),
        },
      },
    });
  }

  logger.info('Shares purchased', { assetId, buyer, amount });
}

async function handleTransactionConfirmed(data: any) {
  const { txHash, blockNumber, gasUsed } = data;

  await prisma.transaction.update({
    where: { txHash },
    data: {
      status: 'CONFIRMED',
      blockNumber: parseInt(blockNumber),
      gasUsed,
    },
  });

  logger.info('Transaction confirmed', { txHash, blockNumber });
}
