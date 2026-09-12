'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOutlet } from '@/hooks/useOutlet';
import { OutletsTable } from '@/components/tables/OutletsTable';
import { Store, Loader2 } from 'lucide-react';
import { Outlet, UserRole } from '@/lib/types';

export default function OutletsPage() {
  const { profile, loading: authLoading } = useAuth();
  const { currentOutletId, outlets: storeOutlets, refreshOutlets } = useOutlet();
  const [outlets, setOutlets] = useState<Outlet[]>(() => storeOutlets || []);
  const [loading, setLoading] = useState(storeOutlets.length === 0);

  const fetchOutlets = useCallback(async () => {
    try {
      const res = await fetch('/api/outlets');
      if (res.ok) {
        const data = await res.json();
        setOutlets(data.outlets || []);
      }
    } catch (err) {
      console.error('Failed to fetch outlets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (storeOutlets.length > 0) {
      setOutlets(storeOutlets);
      setLoading(false);
    } else {
      fetchOutlets();
    }
  }, [storeOutlets, fetchOutlets]);

  if (authLoading && !profile) {
    return (
      <div className="flex flex-col items-center justify-center p-16 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Premium Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/50">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Outlets & Branches
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              {profile?.role === 'admin' ? 'Admin' : 'Branch'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {profile?.role === 'admin'
              ? 'Multi-outlet architecture: configure physical stores, table plans, and operational contexts'
              : 'View your assigned restaurant outlet information and digital menu QR codes'}
          </p>
        </div>
      </div>

      {/* Outlets List Component */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 gap-3 bg-card rounded-2xl border border-border/60">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Loading branches and outlets...</p>
        </div>
      ) : (
        <OutletsTable
          outlets={outlets}
          userRole={(profile?.role as UserRole) || UserRole.STAFF}
          currentOutletId={currentOutletId}
        />
      )}
    </div>
  );
}
