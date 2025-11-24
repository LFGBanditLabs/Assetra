'use client';

import { Asset } from '@/types/asset';
import AssetCard from './AssetCard';

interface AssetListProps {
  assets: Asset[];
  onAssetClick: (asset: Asset) => void;
}

export default function AssetList({ assets, onAssetClick }: AssetListProps) {
  if (assets.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No assets found</h3>
        <p className="text-gray-500">Try adjusting your filters or search criteria.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {assets.map((asset) => (
        <AssetCard
          key={asset.id}
          asset={asset}
          onClick={() => onAssetClick(asset)}
          variant="list"
        />
      ))}
    </div>
  );
}