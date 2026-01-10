'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Outlet } from '@/lib/types';
import { OutletForm } from '@/components/forms/OutletForm';
import { QRCodeModal } from '@/components/outlets/QRCodeModal';
import { Store, Plus, BarChart3, CheckCircle2, QrCode, MapPin, Calendar } from 'lucide-react';
import { UserRole } from '@/lib/types';
import { format } from 'date-fns';
import { useOutlet } from '@/hooks/useOutlet';
import { toast } from 'sonner';

interface OutletsTableProps {
  outlets: Outlet[];
  userRole: UserRole;
  currentOutletId?: string | null;
}

export function OutletsTable({ outlets, userRole, currentOutletId }: OutletsTableProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const { switchOutlet } = useOutlet();
  const [switching, setSwitching] = useState<string | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedOutlet, setSelectedOutlet] = useState<{ id: string; name: string } | null>(null);

  const isAdmin = userRole === UserRole.ADMIN;

  const handleSwitchOutlet = async (outletId: string) => {
    if (outletId === currentOutletId) {
      return;
    }

    setSwitching(outletId);
    try {
      await switchOutlet(outletId);
      toast.success('Outlet switched successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to switch outlet');
      setSwitching(null);
    }
  };

  return (
    <>
      {isAdmin && (
        <div className="flex justify-end mb-4 sm:mb-6">
          <Button onClick={() => setFormOpen(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Add Outlet
          </Button>
        </div>
      )}

      {/* Card Grid Layout */}
      {outlets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Store className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No outlets found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {outlets.map((outlet) => (
            <Card
              key={outlet.id}
              className={`hover:shadow-md transition-all duration-200 ${
                currentOutletId === outlet.id
                  ? 'border-2 border-green-500 bg-green-50/30'
                  : 'border'
              }`}
            >
              <CardContent className="p-4 sm:p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Store className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <h3 className="font-semibold text-base sm:text-lg text-gray-900 truncate">
                      {outlet.name}
                    </h3>
                  </div>
                  {currentOutletId === outlet.id && (
                    <Badge className="bg-green-100 text-green-700 border-green-200 flex-shrink-0">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>

                {/* Address */}
                {outlet.address && (
                  <div className="flex items-start gap-2 mb-3 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-400" />
                    <span className="line-clamp-2">{outlet.address}</span>
                  </div>
                )}

                {/* Created Date */}
                <div className="flex items-center gap-2 mb-4 text-xs text-gray-500">
                  <Calendar className="h-3 w-3" />
                  <span>Created {format(new Date(outlet.created_at), 'dd MMM yyyy')}</span>
                </div>

                {/* Actions */}
                {isAdmin && (
                  <div className="flex flex-wrap gap-2 pt-3 border-t">
                    {currentOutletId !== outlet.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSwitchOutlet(outlet.id)}
                        disabled={switching === outlet.id}
                        className="flex-1 sm:flex-initial text-xs"
                      >
                        {switching === outlet.id ? (
                          'Switching...'
                        ) : (
                          <>
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Switch
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedOutlet({ id: outlet.id, name: outlet.name });
                        setQrModalOpen(true);
                      }}
                      className="flex-1 sm:flex-initial text-xs"
                    >
                      <QrCode className="h-3 w-3 mr-1" />
                      QR Code
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        window.location.href = `/outlets/${outlet.id}`;
                      }}
                      className="flex-1 sm:flex-initial text-xs"
                    >
                      <BarChart3 className="h-3 w-3 mr-1" />
                      Dashboard
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isAdmin && (
        <OutletForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onSuccess={() => {
            router.refresh();
          }}
        />
      )}
      {selectedOutlet && (
        <QRCodeModal
          open={qrModalOpen}
          onOpenChange={setQrModalOpen}
          outletId={selectedOutlet.id}
          outletName={selectedOutlet.name}
        />
      )}
    </>
  );
}
