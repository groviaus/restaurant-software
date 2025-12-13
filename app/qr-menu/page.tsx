'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QrCode, Download } from 'lucide-react';
import { MenuItem } from '@/lib/types';
// Using img tag instead of Next Image for dynamic QR codes

export default function QRMenuPage() {
  const searchParams = useSearchParams();
  const outletId = searchParams.get('outlet');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    if (outletId) {
      fetchMenu(outletId);
      generateQRCode(outletId);
    }
  }, [outletId]);

  const fetchMenu = async (id: string) => {
    try {
      const response = await fetch(`/api/menu?outlet_id=${id}`);
      if (response.ok) {
        const data = await response.json();
        setMenuItems((data.items || []).filter((item: MenuItem) => item.available));
      }
    } catch (error) {
      console.error('Failed to fetch menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async (id: string) => {
    try {
      const response = await fetch(`/api/qr/${id}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setQrCodeUrl(url);
      }
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  };

  const handleDownloadQR = () => {
    if (qrCodeUrl) {
      const a = document.createElement('a');
      a.href = qrCodeUrl;
      a.download = `qr-menu-${outletId}.png`;
      a.click();
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

  if (!outletId) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">QR Menu</h1>
        <p className="text-gray-600">Please provide an outlet ID to view the menu.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Restaurant Menu</h1>
          <p className="text-gray-600">View-only menu - No ordering available</p>
        </div>

        {qrCodeUrl && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QR Code for This Menu
              </CardTitle>
              <CardDescription>
                Share this QR code with customers to access the menu
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <img
                src={qrCodeUrl}
                alt="QR Code"
                width={200}
                height={200}
                className="border rounded"
              />
              <Button onClick={handleDownloadQR}>
                <Download className="h-4 w-4 mr-2" />
                Download QR Code
              </Button>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="text-center py-12">Loading menu...</div>
        ) : (
          <div className="space-y-8">
            {Object.entries(itemsByCategory).map(([category, items]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle>{category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {items.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-lg">{item.name}</h3>
                          <span className="font-bold text-lg">₹{item.price.toFixed(2)}</span>
                        </div>
                        {item.description && (
                          <p className="text-gray-600 text-sm">{item.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

