'use client';

import { ViewType } from '@/types/asset';

interface MarketplaceHeaderProps {
  viewType: ViewType;
  onViewTypeChange: (viewType: ViewType) => void;
  totalAssets: number;
}

export default function MarketplaceHeader({ 
  viewType, 
  onViewTypeChange, 
  totalAssets 
}: MarketplaceHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          {/* Title and Stats */}
          <div className="mb-4 sm:mb-0">
            <h1 className="text-3xl font-bold text-gray-900">
              Asset Marketplace
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Discover and trade fractional shares of tokenized assets
            </p>
            <div className="mt-2 flex items-center space-x-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {totalAssets.toLocaleString()} Assets Available
              </span>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">View:</span>
            <div className="relative bg-gray-100 rounded-lg p-1 flex">
              <button
                onClick={() => onViewTypeChange('GRID')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewType === 'GRID'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => onViewTypeChange('LIST')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewType === 'LIST'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">$</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-900">Total Market Cap</p>
                <p className="text-lg font-semibold text-blue-900">$2.4M</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📈</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-900">24h Volume</p>
                <p className="text-lg font-semibold text-green-900">$142K</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">⭐</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-900">Avg. Yield</p>
                <p className="text-lg font-semibold text-purple-900">8.2%</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">🛡️</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-orange-900">Verified Assets</p>
                <p className="text-lg font-semibold text-orange-900">156</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}