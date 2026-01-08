'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Store, MapPin, AlertCircle, UtensilsCrossed } from 'lucide-react';
import { MenuItem, Outlet } from '@/lib/types';

export default function QRMenuPage() {
  const searchParams = useSearchParams();
  const outletId = searchParams.get('outlet');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [outlet, setOutlet] = useState<Outlet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

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

  // Group items by category
  const itemsByCategory = menuItems.reduce((acc, item) => {
    const category = item.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  // Error state
  if (!outletId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl sm:text-2xl text-red-600">
              Invalid Request
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 text-sm sm:text-base">
              Please scan a valid QR code to view the menu.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl sm:text-2xl text-red-600">
              Error
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 text-sm sm:text-base">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="mx-auto max-w-4xl px-3 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8">
        {/* Outlet Header */}
        {loading ? (
          <Card className="mb-4 sm:mb-6">
            <CardHeader className="pb-4 sm:pb-6">
              <Skeleton className="h-7 w-48 sm:h-8 sm:w-64 mb-2" />
              <Skeleton className="h-4 w-36 sm:w-48" />
            </CardHeader>
          </Card>
        ) : outlet ? (
          <Card className="mb-4 sm:mb-6 border-2 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-4 sm:pb-6">
              <CardTitle className="flex items-center gap-2 sm:gap-3 text-xl sm:text-2xl lg:text-3xl">
                <Store className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-blue-600 flex-shrink-0" />
                <span className="break-words">{outlet.name}</span>
              </CardTitle>
              {outlet.address && (
                <CardDescription className="flex items-start gap-2 text-sm sm:text-base mt-2 sm:mt-3">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-500" />
                  <span className="break-words">{outlet.address}</span>
                </CardDescription>
              )}
            </CardHeader>
          </Card>
        ) : null}

        {/* Menu Header */}
        <div className="text-center mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2 sm:gap-3">
            <UtensilsCrossed className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-gray-700" />
            <span>Our Menu</span>
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">Browse our delicious offerings</p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="space-y-4 sm:space-y-6">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-3 sm:pb-4">
                  <Skeleton className="h-5 w-24 sm:h-6 sm:w-32" />
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="border rounded-lg p-3 sm:p-4 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-1/4" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : menuItems.length === 0 ? (
          /* Empty State */
          <Card>
            <CardContent className="py-12 sm:py-16 text-center px-4">
              <UtensilsCrossed className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">
                No Menu Items Available
              </h3>
              <p className="text-gray-500 text-sm sm:text-base">
                Please check back later for our menu.
              </p>
            </CardContent>
          </Card>
        ) : (
          /* Menu Items by Category */
          <div className="space-y-4 sm:space-y-6">
            {Object.entries(itemsByCategory).map(([category, items]) => (
              <Card key={category} className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="bg-gray-50 border-b pb-3 sm:pb-4">
                  <CardTitle className="text-lg sm:text-xl lg:text-2xl text-gray-800">
                    {category}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 sm:pt-6">
                  <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow bg-white active:bg-gray-50"
                      >
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <h3 className="font-semibold text-base sm:text-lg text-gray-900 flex-1 break-words">
                            {item.name}
                          </h3>
                          <span className="font-bold text-base sm:text-lg text-green-600 flex-shrink-0">
                            ₹{item.price.toFixed(2)}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-gray-600 text-xs sm:text-sm leading-relaxed break-words">
                            {item.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Footer Note */}
        {!loading && menuItems.length > 0 && (
          <Alert className="mt-6 sm:mt-8 bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <AlertDescription className="text-blue-800 text-xs sm:text-sm">
              This is a view-only menu. Please contact staff to place your order.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
