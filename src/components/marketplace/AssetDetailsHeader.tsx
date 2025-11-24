'use client';

import { Asset } from '@/types/asset';

interface AssetDetailsHeaderProps {
  asset: Asset;
  onTradingAction: (action: 'BUY' | 'SELL') => void;
}

export default function AssetDetailsHeader({ asset, onTradingAction }: AssetDetailsHeaderProps) {
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

  const pricePerShare = asset.pricePerShare || (parseFloat(asset.assetValue) / asset.totalShares).toString();
  const availableSharesPercentage = (asset.availableShares / asset.totalShares) * 100;
  const marketCap = asset.marketCap || asset.assetValue;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6">
        {/* Title and Badges */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6">
          <div className="flex-1 mb-4 lg:mb-0">
            <div className="flex items-center space-x-3 mb-3">
              <h1 className="text-3xl font-bold text-gray-900">{asset.name}</h1>
              {asset.isVerified && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified
                </span>
              )}
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getAssetTypeColor(asset.assetType)}`}>
                {asset.assetType.replace('_', ' ')}
              </span>
            </div>
            
            <p className="text-gray-600 text-lg mb-4">{asset.description}</p>
            
            {asset.location && (
              <div className="flex items-center text-gray-500 mb-4">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{asset.location}</span>
              </div>
            )}
          </div>

          {/* Price Information */}
          <div className="lg:text-right">
            <div className="mb-2">
              <p className="text-sm text-gray-500">Current Price per Share</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(pricePerShare)}</p>
            </div>
            
            {asset.priceChange24h && (
              <div className="mb-4">
                <p className="text-sm text-gray-500">24h Change</p>
                <p className={`text-lg font-semibold ${parseFloat(asset.priceChange24h) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(asset.priceChange24h)}
                </p>
              </div>
            )}

            {/* Trading Buttons */}
            <div className="flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-2">
              <button
                onClick={() => onTradingAction('BUY')}
                className="flex-1 lg:flex-none px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
              >
                Buy Shares
              </button>
              <button
                onClick={() => onTradingAction('SELL')}
                className="flex-1 lg:flex-none px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
              >
                Sell Shares
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">Market Cap</p>
            <p className="text-xl font-semibold text-gray-900">{formatCurrency(marketCap)}</p>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">Total Shares</p>
            <p className="text-xl font-semibold text-gray-900">{asset.totalShares.toLocaleString()}</p>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">Available Shares</p>
            <p className="text-xl font-semibold text-gray-900">{asset.availableShares.toLocaleString()}</p>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">Yield Potential</p>
            <p className="text-xl font-semibold text-green-600">{asset.yieldPotential || 'N/A'}%</p>
          </div>
        </div>

        {/* Availability Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Share Availability</span>
            <span className="text-sm text-gray-500">
              {asset.availableShares.toLocaleString()} of {asset.totalShares.toLocaleString()} shares available
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${availableSharesPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">{availableSharesPercentage.toFixed(1)}% of total shares are available for trading</p>
        </div>

        {/* Additional Info */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Asset ID:</span>
              <span className="ml-2 font-mono text-gray-700">{asset.id.slice(0, 8)}...</span>
            </div>
            <div>
              <span className="text-gray-500">Contract:</span>
              <span className="ml-2 font-mono text-gray-700">{asset.contractAddress.slice(0, 10)}...</span>
            </div>
            <div>
              <span className="text-gray-500">Status:</span>
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {asset.status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}