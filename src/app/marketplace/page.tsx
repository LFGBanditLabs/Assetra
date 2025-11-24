'use client';

import { useState, useEffect } from 'react';
import { discoverAssets, getFeaturedAssets } from '@/lib/services/marketplace';
import { Asset } from '@/types/asset';
import MarketplaceHeader from '@/components/marketplace/MarketplaceHeader';
import MarketplaceFilters from '@/components/marketplace/MarketplaceFilters';
import AssetGrid from '@/components/marketplace/AssetGrid';
import AssetList from '@/components/marketplace/AssetList';
import FeaturedAssets from '@/components/marketplace/FeaturedAssets';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useSearchParams, useRouter } from 'next/navigation';

export default function MarketplacePage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [featuredAssets, setFeaturedAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<'GRID' | 'LIST'>('GRID');
  const [filters, setFilters] = useState({
    search: '',
    assetType: [],
    status: [],
    location: [],
    minPrice: undefined,
    maxPrice: undefined,
    minYield: undefined,
    maxYield: undefined,
    riskRating: [],
    verificationStatus: [],
    sortBy: 'CREATED_AT',
    sortOrder: 'DESC' as 'ASC' | 'DESC',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  const searchParams = useSearchParams();
  const router = useRouter();

  // Load initial data
  useEffect(() => {
    loadMarketplaceData();
    loadFeaturedAssets();
  }, []);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && (Array.isArray(value) ? value.length > 0 : true)) {
        if (Array.isArray(value)) {
          params.set(key, value.join(','));
        } else {
          params.set(key, String(value));
        }
      }
    });
    params.set('page', String(pagination.page));
    params.set('limit', String(pagination.limit));
    router.replace(`/marketplace?${params.toString()}`);
  }, [filters, pagination.page, router]);

  // Load data when URL params change
  useEffect(() => {
    const urlParams = Object.fromEntries(searchParams.entries());
    if (Object.keys(urlParams).length > 0) {
      const newFilters = {
        search: urlParams.search || '',
        assetType: urlParams.assetType?.split(',') || [],
        status: urlParams.status?.split(',') || [],
        location: urlParams.location?.split(',') || [],
        minPrice: urlParams.minPrice ? parseFloat(urlParams.minPrice) : undefined,
        maxPrice: urlParams.maxPrice ? parseFloat(urlParams.maxPrice) : undefined,
        minYield: urlParams.minYield ? parseFloat(urlParams.minYield) : undefined,
        maxYield: urlParams.maxYield ? parseFloat(urlParams.maxYield) : undefined,
        riskRating: urlParams.riskRating?.split(',') || [],
        verificationStatus: urlParams.verificationStatus?.split(',') || [],
        sortBy: urlParams.sortBy || 'CREATED_AT',
        sortOrder: (urlParams.sortOrder as 'ASC' | 'DESC') || 'DESC',
      };
      setFilters(newFilters);
      setPagination(prev => ({
        ...prev,
        page: parseInt(urlParams.page || '1'),
        limit: parseInt(urlParams.limit || '12'),
      }));
    }
  }, [searchParams]);

  const loadMarketplaceData = async () => {
    try {
      setLoading(true);
      const response = await discoverAssets({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      });
      
      setAssets(response.assets);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to load marketplace data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeaturedAssets = async () => {
    try {
      const response = await getFeaturedAssets({ type: 'featured', limit: 6 });
      setFeaturedAssets(response.assets);
    } catch (error) {
      console.error('Failed to load featured assets:', error);
    }
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleViewTypeChange = (newViewType: 'GRID' | 'LIST') => {
    setViewType(newViewType);
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleSortChange = (sortBy: string, sortOrder: 'ASC' | 'DESC') => {
    setFilters(prev => ({ ...prev, sortBy, sortOrder }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MarketplaceHeader 
        viewType={viewType}
        onViewTypeChange={handleViewTypeChange}
        totalAssets={pagination.total}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Featured Assets Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Assets</h2>
          <FeaturedAssets assets={featuredAssets} />
        </section>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <MarketplaceFilters
              filters={filters}
              onFiltersChange={handleFilterChange}
              onSortChange={handleSortChange}
            />
          </div>

          {/* Assets Grid/List */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="large" />
              </div>
            ) : (
              <>
                {/* Results Header */}
                <div className="flex justify-between items-center mb-6">
                  <p className="text-gray-600">
                    {pagination.total} assets found
                  </p>
                </div>

                {/* Assets Display */}
                {viewType === 'GRID' ? (
                  <AssetGrid 
                    assets={assets}
                    onAssetClick={(asset) => router.push(`/marketplace/asset/${asset.id}`)}
                  />
                ) : (
                  <AssetList 
                    assets={assets}
                    onAssetClick={(asset) => router.push(`/marketplace/asset/${asset.id}`)}
                  />
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <nav className="flex space-x-2">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-2 text-sm font-medium rounded-md ${
                              pageNum === pagination.page
                                ? 'text-blue-600 bg-blue-50 border border-blue-300'
                                : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page >= pagination.totalPages}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}