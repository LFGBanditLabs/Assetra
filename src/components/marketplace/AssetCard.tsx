'use client';

import { Asset } from '@/types/asset';

interface AssetCardProps {
  asset: Asset;
  onClick: () => void;
  variant?: 'grid' | 'list';
}

export default function AssetCard({ asset, onClick, variant = 'grid' }: AssetCardProps) {
  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatPercentage = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `${num > 0 ? '+' : ''}${num.toFixed(2)}%`;
  };

  const getAssetTypeColor = (type: string) => {
    switch (type) {
      case 'REAL_ESTATE':
        return 'bg-blue-100 text-blue-800';
      case 'COMMODITIES':
        return 'bg-yellow-100 text-yellow-800';
      case 'ART':
        return 'bg-purple-100 text-purple-800';
      case 'COLLECTIBLES':
        return 'bg-green-100 text-green-800';
      case 'VEHICLES':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk?: string) => {
    switch (risk) {
      case 'LOW':
        return 'text-green-600';
      case 'MEDIUM':
        return 'text-yellow-600';
      case 'HIGH':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const pricePerShare = asset.pricePerShare || (parseFloat(asset.assetValue) / asset.totalShares).toString();
  const availableSharesPercentage = (asset.availableShares / asset.totalShares) * 100;

  if (variant === 'list') {
    return (
      <div 
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
        onClick={onClick}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{asset.name}</h3>
              {asset.isVerified && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified
                </span>
              )}
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getAssetTypeColor(asset.assetType)}`}>
                {asset.assetType.replace('_', ' ')}
              </span>
            </div>
            
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{asset.description}</p>
            
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Price/Share</p>
                <p className="font-semibold text-gray-900">{formatCurrency(pricePerShare)}</p>
              </div>
              <div>
                <p className="text-gray-500">Market Cap</p>
                <p className="font-semibold text-gray-900">{formatCurrency(asset.marketCap || asset.assetValue)}</p>
              </div>
              <div>
                <p className="text-gray-500">Available</p>
                <p className="font-semibold text-gray-900">{asset.availableShares.toLocaleString()} shares</p>
              </div>
              <div>
                <p className="text-gray-500">Yield</p>
                <p className="font-semibold text-green-600">{asset.yieldPotential || '0'}%</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-2">
            {asset.priceChange24h && (
              <span className={`text-sm font-medium ${parseFloat(asset.priceChange24h) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(asset.priceChange24h)}
              </span>
            )}
            {asset.riskRating && (
              <span className={`text-xs font-medium ${getRiskColor(asset.riskRating)}`}>
                {asset.riskRating} Risk
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Grid variant
  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
      onClick={onClick}
    >
      {/* Asset Image */}
      <div className="h-48 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center relative">
        {asset.ipfsHash ? (
          <img 
            src={`https://gateway.pinata.cloud/ipfs/${asset.ipfsHash}`}
            alt={asset.name}
            className="w-full h-full object-cover"
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
        
        {/* Overlay badges */}
        <div className="absolute top-3 left-3 flex flex-col space-y-2">
          {asset.isVerified && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Verified
            </span>
          )}
          {asset.riskRating && (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white text-gray-700 ${getRiskColor(asset.riskRating)}`}>
              {asset.riskRating} Risk
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
            {asset.name}
          </h3>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getAssetTypeColor(asset.assetType)}`}>
            {asset.assetType.replace('_', ' ')}
          </span>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{asset.description}</p>

        {/* Key Metrics */}
        <div className="space-y-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Price/Share</span>
            <span className="font-semibold text-gray-900">{formatCurrency(pricePerShare)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Market Cap</span>
            <span className="font-semibold text-gray-900">{formatCurrency(asset.marketCap || asset.assetValue)}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Yield</span>
            <span className="font-semibold text-green-600">{asset.yieldPotential || '0'}%</span>
          </div>
        </div>

        {/* Availability Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-500">Available Shares</span>
            <span className="text-sm font-medium text-gray-700">
              {asset.availableShares.toLocaleString()} / {asset.totalShares.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${availableSharesPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">{availableSharesPercentage.toFixed(1)}% available</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            {asset.location && (
              <div className="flex items-center text-sm text-gray-500">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {asset.location}
              </div>
            )}
          </div>
          
          {asset.priceChange24h && (
            <span className={`text-sm font-medium ${parseFloat(asset.priceChange24h) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentage(asset.priceChange24h)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}