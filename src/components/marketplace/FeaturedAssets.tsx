'use client';

import { Asset } from '@/types/asset';
import Link from 'next/link';

interface FeaturedAssetsProps {
  assets: Asset[];
}

export default function FeaturedAssets({ assets }: FeaturedAssetsProps) {
  if (assets.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-lg h-64 animate-pulse" />
        ))}
      </div>
    );
  }

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {assets.map((asset, index) => {
        const pricePerShare = asset.pricePerShare || (parseFloat(asset.assetValue) / asset.totalShares).toString();
        const isTopPick = index === 0;

        return (
          <Link 
            key={asset.id} 
            href={`/marketplace/asset/${asset.id}`}
            className="group relative bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 transform hover:-translate-y-1"
          >
            {/* Badge for top pick */}
            {isTopPick && (
              <div className="absolute top-3 left-3 z-10">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  ⭐ Top Pick
                </span>
              </div>
            )}

            {/* Image */}
            <div className="h-48 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center relative">
              {asset.ipfsHash ? (
                <img 
                  src={`https://gateway.pinata.cloud/ipfs/${asset.ipfsHash}`}
                  alt={asset.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              )}

              {/* Verification badge */}
              {asset.isVerified && (
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {asset.name}
                </h3>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {asset.assetType.replace('_', ' ')}
                </span>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{asset.description}</p>

              {/* Metrics */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Price/Share</span>
                  <span className="font-bold text-lg text-gray-900">{formatCurrency(pricePerShare)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Market Cap</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(asset.marketCap || asset.assetValue)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Yield Potential</span>
                  <span className="font-semibold text-green-600">{asset.yieldPotential || '0'}%</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Available Shares</span>
                  <span className="font-medium text-gray-700">
                    {asset.availableShares.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* CTA Button */}
              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">View Details</span>
                  <div className="flex items-center text-blue-600 group-hover:text-blue-700">
                    <span className="text-sm font-medium">Explore</span>
                    <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}