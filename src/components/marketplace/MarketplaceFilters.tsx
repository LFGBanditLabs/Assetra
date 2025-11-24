'use client';

import { useState } from 'react';
import { MarketplaceFilters as MarketplaceFiltersType } from '@/types/asset';

interface MarketplaceFiltersProps {
  filters: MarketplaceFiltersType;
  onFiltersChange: (filters: Partial<MarketplaceFiltersType>) => void;
  onSortChange: (sortBy: string, sortOrder: 'ASC' | 'DESC') => void;
}

export default function MarketplaceFilters({ 
  filters, 
  onFiltersChange, 
  onSortChange 
}: MarketplaceFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const assetTypes = [
    { value: 'REAL_ESTATE', label: 'Real Estate' },
    { value: 'COMMODITIES', label: 'Commodities' },
    { value: 'ART', label: 'Art' },
    { value: 'COLLECTIBLES', label: 'Collectibles' },
    { value: 'VEHICLES', label: 'Vehicles' },
    { value: 'OTHER', label: 'Other' },
  ];

  const locations = [
    { value: 'NEW_YORK', label: 'New York' },
    { value: 'LOS_ANGELES', label: 'Los Angeles' },
    { value: 'MIAMI', label: 'Miami' },
    { value: 'LONDON', label: 'London' },
    { value: 'TOKYO', label: 'Tokyo' },
    { value: 'SINGAPORE', label: 'Singapore' },
  ];

  const riskRatings = [
    { value: 'LOW', label: 'Low Risk' },
    { value: 'MEDIUM', label: 'Medium Risk' },
    { value: 'HIGH', label: 'High Risk' },
  ];

  const handleFilterToggle = (filterType: keyof MarketplaceFiltersType, value: string) => {
    const currentValues = filters[filterType] as string[] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    onFiltersChange({ [filterType]: newValues });
  };

  const handlePriceRangeChange = (field: 'minPrice' | 'maxPrice', value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    onFiltersChange({ [field]: numValue });
  };

  const handleYieldRangeChange = (field: 'minYield' | 'maxYield', value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    onFiltersChange({ [field]: numValue });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      <div className={`space-y-6 ${!isExpanded ? 'hidden' : ''}`}>
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Assets
          </label>
          <input
            type="text"
            placeholder="Search by name or description..."
            value={filters.search || ''}
            onChange={(e) => onFiltersChange({ search: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Asset Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Asset Type
          </label>
          <div className="space-y-2">
            {assetTypes.map((type) => (
              <label key={type.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.assetType?.includes(type.value) || false}
                  onChange={() => handleFilterToggle('assetType', type.value)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{type.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <div className="space-y-2">
            {locations.map((location) => (
              <label key={location.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.location?.includes(location.value) || false}
                  onChange={() => handleFilterToggle('location', location.value)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{location.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price Range ($)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.minPrice || ''}
              onChange={(e) => handlePriceRangeChange('minPrice', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.maxPrice || ''}
              onChange={(e) => handlePriceRangeChange('maxPrice', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Yield Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Yield Range (%)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Min"
              step="0.1"
              value={filters.minYield || ''}
              onChange={(e) => handleYieldRangeChange('minYield', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="number"
              placeholder="Max"
              step="0.1"
              value={filters.maxYield || ''}
              onChange={(e) => handleYieldRangeChange('maxYield', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Risk Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Risk Rating
          </label>
          <div className="space-y-2">
            {riskRatings.map((risk) => (
              <label key={risk.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.riskRating?.includes(risk.value) || false}
                  onChange={() => handleFilterToggle('riskRating', risk.value)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{risk.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Verification Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Verification Status
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.verificationStatus?.includes('VERIFIED') || false}
                onChange={() => handleFilterToggle('verificationStatus', 'VERIFIED')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Verified Only</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.verificationStatus?.includes('UNVERIFIED') || false}
                onChange={() => handleFilterToggle('verificationStatus', 'UNVERIFIED')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Unverified</span>
            </label>
          </div>
        </div>

        {/* Sort Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <select
            value={filters.sortBy || 'CREATED_AT'}
            onChange={(e) => onSortChange(e.target.value, filters.sortOrder || 'DESC')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="CREATED_AT">Date Added</option>
            <option value="PRICE">Price</option>
            <option value="MARKET_CAP">Market Cap</option>
            <option value="VOLUME">Volume</option>
            <option value="YIELD">Yield</option>
          </select>
          
          <div className="mt-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => onSortChange(filters.sortBy || 'CREATED_AT', 'ASC')}
                className={`px-3 py-1 text-sm rounded-md ${
                  filters.sortOrder === 'ASC'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Ascending
              </button>
              <button
                onClick={() => onSortChange(filters.sortBy || 'CREATED_AT', 'DESC')}
                className={`px-3 py-1 text-sm rounded-md ${
                  filters.sortOrder === 'DESC'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Descending
              </button>
            </div>
          </div>
        </div>

        {/* Clear Filters */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={() => onFiltersChange({
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
            })}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Clear All Filters
          </button>
        </div>
      </div>
    </div>
  );
}