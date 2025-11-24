'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getAsset, getAssetForTrading } from '@/lib/services/marketplace';
import { Asset, AssetOrder, AssetOffer } from '@/types/asset';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import AssetDetailsHeader from '@/components/marketplace/AssetDetailsHeader';
import AssetImageGallery from '@/components/marketplace/AssetImageGallery';
import AssetInfoTabs from '@/components/marketplace/AssetInfoTabs';
import TradingPanel from '@/components/marketplace/TradingPanel';
import OrderBook from '@/components/marketplace/OrderBook';
import RelatedAssets from '@/components/marketplace/RelatedAssets';

export default function AssetDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const assetId = params.id as string;
  
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'history' | 'analytics'>('overview');
  const [showTradingPanel, setShowTradingPanel] = useState(false);

  useEffect(() => {
    if (assetId) {
      loadAssetDetails();
    }
  }, [assetId]);

  const loadAssetDetails = async () => {
    try {
      setLoading(true);
      const response = await getAsset(assetId);
      setAsset(response.asset);
    } catch (error) {
      console.error('Failed to load asset details:', error);
      setError('Failed to load asset details');
    } finally {
      setLoading(false);
    }
  };

  const handleTradingAction = (action: 'BUY' | 'SELL') => {
    setShowTradingPanel(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Asset not found</h3>
          <p className="text-gray-500 mb-4">{error || 'The asset you are looking for does not exist.'}</p>
          <button
            onClick={() => router.push('/marketplace')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center text-blue-600 hover:text-blue-700"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Marketplace
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Asset Header */}
            <AssetDetailsHeader 
              asset={asset} 
              onTradingAction={handleTradingAction}
            />

            {/* Image Gallery */}
            <AssetImageGallery asset={asset} />

            {/* Tabbed Content */}
            <AssetInfoTabs 
              asset={asset}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Trading Panel */}
            {showTradingPanel && (
              <TradingPanel 
                asset={asset}
                onClose={() => setShowTradingPanel(false)}
              />
            )}

            {/* Quick Actions */}
            {!showTradingPanel && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => handleTradingAction('BUY')}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
                  >
                    Buy Shares
                  </button>
                  <button
                    onClick={() => handleTradingAction('SELL')}
                    className="w-full px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
                  >
                    Sell Shares
                  </button>
                  <button className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium">
                    Make Offer
                  </button>
                </div>
              </div>
            )}

            {/* Order Book */}
            <OrderBook assetId={asset.id} />

            {/* Key Metrics */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Shares</span>
                  <span className="font-medium text-gray-900">{asset.totalShares.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Available Shares</span>
                  <span className="font-medium text-gray-900">{asset.availableShares.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Market Cap</span>
                  <span className="font-medium text-gray-900">
                    ${(asset.pricePerShare ? parseFloat(asset.pricePerShare) * asset.totalShares : parseFloat(asset.assetValue)).toLocaleString()}
                  </span>
                </div>
                {asset.volume24h && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">24h Volume</span>
                    <span className="font-medium text-gray-900">{asset.volume24h}</span>
                  </div>
                )}
                {asset.yieldPotential && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Yield Potential</span>
                    <span className="font-medium text-green-600">{asset.yieldPotential}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Risk Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessment</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Risk Level</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    asset.riskRating === 'LOW' ? 'bg-green-100 text-green-800' :
                    asset.riskRating === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {asset.riskRating || 'Not Rated'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Verification Status</span>
                  <span className="flex items-center">
                    {asset.isVerified ? (
                      <>
                        <svg className="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-green-600 text-sm">Verified</span>
                      </>
                    ) : (
                      <span className="text-yellow-600 text-sm">Pending</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Assets */}
        <div className="mt-12">
          <RelatedAssets 
            currentAsset={asset}
            excludeId={asset.id}
          />
        </div>
      </div>
    </div>
  );
}