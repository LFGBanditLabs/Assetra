import { apiFetch } from '@/lib/services/httpClient';
import { Asset, AssetOrder, AssetOffer, MarketplaceFilters, PaginatedAssetsResponse } from '@/types/asset';

export interface DiscoveryQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  assetType?: string[];
  status?: string[];
  location?: string[];
  minPrice?: number;
  maxPrice?: number;
  minYield?: number;
  maxYield?: number;
  riskRating?: string[];
  verificationStatus?: string[];
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  viewType?: 'GRID' | 'LIST';
}

export interface FeaturedAssetsRequest {
  type: 'featured' | 'trending' | 'high_yield';
  limit?: number;
}

export interface CreateOrderPayload {
  assetId: string;
  type: 'BUY' | 'SELL';
  amount: number;
  pricePerShare: number;
  expiresAt?: string;
}

export interface CreateOfferPayload {
  assetId: string;
  amount: number;
  offerPricePerShare: number;
  message?: string;
  expiresAt: string;
}

// Marketplace Discovery API
export async function discoverAssets(params: DiscoveryQueryParams = {}) {
  const searchParams = new URLSearchParams();
  
  // Add all parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        searchParams.append(key, value.join(','));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });

  const queryString = searchParams.toString();
  const url = queryString ? `/api/marketplace/discover?${queryString}` : '/api/marketplace/discover';

  return apiFetch<{
    assets: Asset[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    filters: MarketplaceFilters;
  }>(url);
}

// Get Featured Assets
export async function getFeaturedAssets(request: FeaturedAssetsRequest) {
  return apiFetch<{
    assets: Asset[];
    type: string;
  }>('/api/marketplace/discover', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

// Create Order
export async function createOrder(payload: CreateOrderPayload, identity?: { userId?: string; walletAddress?: string; email?: string }) {
  const headers: Record<string, string> = {};
  
  if (identity?.userId) headers['x-user-id'] = identity.userId;
  if (identity?.walletAddress) headers['x-wallet-address'] = identity.walletAddress;
  if (identity?.email) headers['x-user-email'] = identity.email;

  return apiFetch<{
    order: AssetOrder;
  }>('/api/marketplace/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers,
  });
}

// Get User Orders
export async function getUserOrders(params: {
  type?: 'BUY' | 'SELL';
  status?: string;
  assetId?: string;
  page?: number;
  limit?: number;
} = {}, identity?: { userId?: string; walletAddress?: string; email?: string }) {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  const url = queryString ? `/api/marketplace/orders?${queryString}` : '/api/marketplace/orders';

  const headers: Record<string, string> = {};
  
  if (identity?.userId) headers['x-user-id'] = identity.userId;
  if (identity?.walletAddress) headers['x-wallet-address'] = identity.walletAddress;
  if (identity?.email) headers['x-user-email'] = identity.email;

  return apiFetch<{
    orders: AssetOrder[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>(url, { headers });
}

// Get Asset Details for Trading
export async function getAssetForTrading(assetId: string) {
  return apiFetch<{
    asset: Asset & {
      orders?: AssetOrder[];
      offers?: AssetOffer[];
      priceHistory?: Array<{
        timestamp: string;
        price: number;
        volume: number;
      }>;
    };
  }>(`/api/marketplace/assets/${assetId}/trade`);
}

// Create Offer
export async function createOffer(payload: CreateOfferPayload, identity?: { userId?: string; walletAddress?: string; email?: string }) {
  const headers: Record<string, string> = {};
  
  if (identity?.userId) headers['x-user-id'] = identity.userId;
  if (identity?.walletAddress) headers['x-wallet-address'] = identity.walletAddress;
  if (identity?.email) headers['x-user-email'] = identity.email;

  return apiFetch<{
    offer: AssetOffer;
  }>('/api/marketplace/offers', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers,
  });
}

// Respond to Offer
export async function respondToOffer(offerId: string, response: 'ACCEPTED' | 'REJECTED', identity?: { userId?: string; walletAddress?: string; email?: string }) {
  const headers: Record<string, string> = {};
  
  if (identity?.userId) headers['x-user-id'] = identity.userId;
  if (identity?.walletAddress) headers['x-wallet-address'] = identity.walletAddress;
  if (identity?.email) headers['x-user-email'] = identity.email;

  return apiFetch<{
    offer: AssetOffer;
  }>(`/api/marketplace/offers/${offerId}/respond`, {
    method: 'POST',
    body: JSON.stringify({ response }),
    headers,
  });
}

// Cancel Order
export async function cancelOrder(orderId: string, identity?: { userId?: string; walletAddress?: string; email?: string }) {
  const headers: Record<string, string> = {};
  
  if (identity?.userId) headers['x-user-id'] = identity.userId;
  if (identity?.walletAddress) headers['x-wallet-address'] = identity.walletAddress;
  if (identity?.email) headers['x-user-email'] = identity.email;

  return apiFetch<{
    order: AssetOrder;
  }>(`/api/marketplace/orders/${orderId}/cancel`, {
    method: 'POST',
    headers,
  });
}

// Get Order Book for Asset
export async function getOrderBook(assetId: string) {
  return apiFetch<{
    buyOrders: AssetOrder[];
    sellOrders: AssetOrder[];
    spread: number;
    volume24h: number;
  }>(`/api/marketplace/orderbook/${assetId}`);
}

// Portfolio Management
export async function getUserPortfolio(userId: string, identity?: { userId?: string; walletAddress?: string; email?: string }) {
  const headers: Record<string, string> = {};
  
  if (identity?.userId) headers['x-user-id'] = identity.userId;
  if (identity?.walletAddress) headers['x-wallet-address'] = identity.walletAddress;
  if (identity?.email) headers['x-user-email'] = identity.email;

  return apiFetch<{
    portfolio: {
      totalValue: number;
      totalShares: number;
      assets: Array<{
        asset: Asset;
        shares: number;
        currentValue: number;
        purchaseValue: number;
        gainLoss: number;
        gainLossPercent: number;
      }>;
      performance: {
        totalReturn: number;
        totalReturnPercent: number;
        dayChange: number;
        dayChangePercent: number;
      };
    };
  }>(`/api/marketplace/portfolio/${userId}`, { headers });
}