'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Store, MapPin, AlertCircle, UtensilsCrossed, Search, X } from 'lucide-react';
import { MenuItem, Outlet, QuantityType, PricingMode } from '@/lib/types';

function QRMenuContent() {
  const searchParams = useSearchParams();
  const outletId = searchParams.get('outlet');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [outlet, setOutlet] = useState<Outlet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (outletId) {
      fetchOutletAndMenu(outletId);
    } else {
      setLoading(false);
      setError('No outlet ID provided');
    }
  }, [outletId]);

  const fetchOutletAndMenu = async (id: string) => {
    setLoading(true);
    setError('');

    try {
      // Fetch outlet information
      const outletResponse = await fetch(`/api/outlets/${id}`);
      if (!outletResponse.ok) {
        throw new Error('Outlet not found');
      }
      const outletData = await outletResponse.json();
      setOutlet(outletData);

      // Fetch menu items
      const menuResponse = await fetch(`/api/menu?outlet_id=${id}`);
      if (menuResponse.ok) {
        const menuData = await menuResponse.json();
        setMenuItems((menuData.items || []).filter((item: MenuItem) => item.available));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  // Get all unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    menuItems.forEach(item => {
      const cat = item.category || 'Other';
      cats.add(cat);
    });
    return Array.from(cats).sort();
  }, [menuItems]);

  // Filter items based on search and category
  const filteredItems = useMemo(() => {
    let filtered = menuItems;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(item => 
        (item.category || 'Other') === selectedCategory
      );
    }

    return filtered;
  }, [menuItems, searchQuery, selectedCategory]);

  // Group filtered items by category
  const itemsByCategory = useMemo(() => {
    return filteredItems.reduce((acc, item) => {
      const category = item.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as Record<string, MenuItem[]>);
  }, [filteredItems]);

  // Get price for item based on quantity type
  const getItemPrice = (item: MenuItem, quantityType?: QuantityType): number => {
    if (item.pricing_mode === PricingMode.FIXED) {
      return item.price;
    } else if (item.pricing_mode === PricingMode.QUANTITY_AUTO) {
      const basePrice = item.base_price || item.price;
      switch (quantityType) {
        case QuantityType.QUARTER:
          return basePrice * 0.25;
        case QuantityType.HALF:
          return basePrice * 0.5;
        case QuantityType.THREE_QUARTER:
          return basePrice * 0.75;
        case QuantityType.FULL:
        default:
          return basePrice;
      }
    } else if (item.pricing_mode === PricingMode.QUANTITY_MANUAL) {
      switch (quantityType) {
        case QuantityType.QUARTER:
          return item.quarter_price ?? 0;
        case QuantityType.HALF:
          return item.half_price ?? 0;
        case QuantityType.THREE_QUARTER:
          return item.three_quarter_price ?? 0;
        case QuantityType.FULL:
        default:
          return item.full_price ?? item.price;
      }
    }
    return item.price;
  };

  // Get quantity label
  const getQuantityLabel = (type: QuantityType): string => {
    switch (type) {
      case QuantityType.QUARTER:
        return 'Quarter';
      case QuantityType.HALF:
        return 'Half';
      case QuantityType.THREE_QUARTER:
        return 'Three-Quarter';
      case QuantityType.FULL:
        return 'Full';
      default:
        return '';
    }
  };

  // Error state
  if (!outletId) {
    return (
      <div className="min-h-screen bg-[#f5f1e8] flex items-center justify-center p-4" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)',
        backgroundSize: '20px 20px'
      }}>
        <div className="max-w-md w-full bg-[#fefcf8] rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.05)] p-6 sm:p-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Invalid Request
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">
              Please scan a valid QR code to view the menu.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f5f1e8] flex items-center justify-center p-4" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)',
        backgroundSize: '20px 20px'
      }}>
        <div className="max-w-md w-full bg-[#fefcf8] rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.05)] p-6 sm:p-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Error
            </h2>
            <p className="text-gray-600 text-sm sm:text-base">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-[#f5f1e8] py-4 sm:py-6 lg:py-8"
      style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)',
        backgroundSize: '20px 20px'
      }}
    >
      <div className="mx-auto max-w-4xl px-3 sm:px-4 lg:px-6">
        {/* Outlet Header - Paper Card */}
        {loading ? (
          <div className="mb-4 sm:mb-6 bg-[#fefcf8] rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.05)] p-4 sm:p-6">
            <Skeleton className="h-7 w-48 sm:h-8 sm:w-64 mb-2" />
            <Skeleton className="h-4 w-36 sm:w-48" />
          </div>
        ) : outlet ? (
          <div className="mb-4 sm:mb-6 bg-[#fefcf8] rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.05)] p-4 sm:p-6 border-l-4 border-amber-600">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <Store className="h-5 w-5 sm:h-6 sm:w-6 text-amber-700 flex-shrink-0" />
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 break-words">
                {outlet.name}
              </h1>
            </div>
            {outlet.address && (
              <div className="flex items-start gap-2 text-sm sm:text-base text-gray-700 mt-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-500" />
                <span className="break-words">{outlet.address}</span>
              </div>
            )}
          </div>
        ) : null}

        {/* Menu Header */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="inline-flex items-center gap-2 sm:gap-3 mb-2">
            <UtensilsCrossed className="h-6 w-6 sm:h-7 sm:w-7 text-amber-700" />
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
              Our Menu
            </h2>
          </div>
          <p className="text-gray-600 text-sm sm:text-base">Browse our delicious offerings</p>
        </div>

        {/* Search and Filter Section - Paper Style */}
        {!loading && menuItems.length > 0 && (
          <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
            {/* Search Bar */}
            <div className="bg-[#fefcf8] rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.05)] p-3 sm:p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search items by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 sm:pl-10 pr-9 sm:pr-10 h-10 sm:h-11 bg-white border-gray-200 focus:border-amber-400 focus:ring-amber-400 text-sm sm:text-base"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter */}
            {categories.length > 0 && (
              <div className="bg-[#fefcf8] rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.05)] p-3 sm:p-4">
                <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Filter by Category:</p>
                <ScrollArea className="w-full whitespace-nowrap">
                  <div className="flex gap-2 pb-2 px-0.5">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                        selectedCategory === null
                          ? 'bg-amber-600 text-white shadow-md'
                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-amber-50 hover:border-amber-300'
                      }`}
                    >
                      All Items
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                          selectedCategory === category
                            ? 'bg-amber-600 text-white shadow-md'
                            : 'bg-white text-gray-700 border border-gray-200 hover:bg-amber-50 hover:border-amber-300'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            )}

            {/* Results Count */}
            {(searchQuery || selectedCategory) && (
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Showing <span className="font-semibold text-amber-700">{filteredItems.length}</span> of <span className="font-semibold">{menuItems.length}</span> items
                  {searchQuery && (
                    <span className="ml-1">
                      matching "<span className="font-semibold">{searchQuery}</span>"
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="space-y-4 sm:space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-[#fefcf8] rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.05)] p-4 sm:p-6">
                <Skeleton className="h-5 w-24 sm:h-6 sm:w-32 mb-4" />
                <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="border border-gray-200 rounded-lg p-3 sm:p-4 space-y-2 bg-white">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-1/4" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : menuItems.length === 0 ? (
          /* Empty State */
          <div className="bg-[#fefcf8] rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.05)] p-8 sm:p-12 text-center">
            <UtensilsCrossed className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">
              No Menu Items Available
            </h3>
            <p className="text-gray-500 text-sm sm:text-base">
              Please check back later for our menu.
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          /* No Results State */
          <div className="bg-[#fefcf8] rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.05)] p-8 sm:p-12 text-center">
            <Search className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">
              No Items Found
            </h3>
            <p className="text-gray-500 text-sm sm:text-base mb-4">
              {searchQuery 
                ? `No items match "${searchQuery}". Try a different search term.`
                : 'No items found in the selected category.'}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory(null);
              }}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm sm:text-base font-medium"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          /* Menu Items by Category - Paper Style */
          <div className="space-y-4 sm:space-y-6">
            {Object.entries(itemsByCategory).map(([category, items]) => (
              <div 
                key={category} 
                className="bg-[#fefcf8] rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.05)] overflow-hidden"
              >
                {/* Category Header */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b-2 border-amber-200 px-4 sm:px-6 py-3 sm:py-4">
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                    {category}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </p>
                </div>

                {/* Items Grid */}
                <div className="p-3 sm:p-4 lg:p-6">
                  <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((item) => {
                      const hasQuantityOptions = item.requires_quantity && item.available_quantity_types && item.available_quantity_types.length > 0;
                      const defaultQuantityType = hasQuantityOptions && item.available_quantity_types ? item.available_quantity_types[0] : undefined;
                      const displayPrice = getItemPrice(item, defaultQuantityType);

                      return (
                        <div
                          key={item.id}
                          className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-all duration-200 hover:border-amber-300"
                          style={{
                            boxShadow: '0 1px 3px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.5)'
                          }}
                        >
                          {/* Item Name and Price */}
                          <div className="mb-2 sm:mb-3">
                            <h4 className="font-bold text-base sm:text-lg text-gray-900 mb-1 break-words">
                              {item.name}
                            </h4>
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="text-lg sm:text-xl font-bold text-amber-700">
                                ₹{displayPrice.toFixed(0)}
                              </span>
                              {item.pricing_mode !== PricingMode.FIXED && hasQuantityOptions && (
                                <span className="text-xs text-gray-500">
                                  ({getQuantityLabel(defaultQuantityType!)})
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Description */}
                          {item.description && (
                            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed mb-3 break-words line-clamp-2">
                              {item.description}
                            </p>
                          )}

                          {/* Quantity Options */}
                          {hasQuantityOptions && item.available_quantity_types && item.available_quantity_types.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <p className="text-xs font-semibold text-gray-700 mb-2">Available Sizes:</p>
                              <div className="flex flex-wrap gap-1.5">
                                {item.available_quantity_types.map((qType) => {
                                  const qPrice = getItemPrice(item, qType);
                                  return (
                                    <div
                                      key={qType}
                                      className="px-2 py-1 bg-amber-50 border border-amber-200 rounded text-xs"
                                    >
                                      <span className="font-medium text-gray-700">{getQuantityLabel(qType)}</span>
                                      <span className="text-amber-700 font-semibold ml-1">
                                        ₹{qPrice.toFixed(0)}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Note - Paper Style */}
        {!loading && menuItems.length > 0 && (
          <div className="mt-6 sm:mt-8 bg-blue-50 border-l-4 border-blue-400 rounded-lg p-3 sm:p-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            <div className="flex items-start gap-2 sm:gap-3">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-blue-800 text-xs sm:text-sm leading-relaxed">
                This is a view-only menu. Please contact staff to place your order.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function QRMenuPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f5f1e8] flex items-center justify-center" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)',
        backgroundSize: '20px 20px'
      }}>
        <div className="text-center">
          <Skeleton className="h-12 w-48 mx-auto mb-4" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    }>
      <QRMenuContent />
    </Suspense>
  );
}
