'use client';

import { useState } from 'react';
import { useMenuItemsQuery, useCategoriesQuery } from '@/hooks/queries/useMenuQuery';
import { MenuTable } from '@/components/tables/MenuTable';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

import { useOutlet } from '@/hooks/useOutlet';

interface MenuPageClientProps {
  outletId?: string;
}

export function MenuPageClient({ outletId: propOutletId }: MenuPageClientProps) {
  const { currentOutletId } = useOutlet();
  const outletId = propOutletId || currentOutletId || '';
  const [isSyncing, setIsSyncing] = useState(false);
  const menuQuery = useMenuItemsQuery(outletId);
  const categoriesQuery = useCategoriesQuery(outletId);
  const items = menuQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await Promise.all([menuQuery.refetch(), categoriesQuery.refetch()]);
      toast.success('Menu catalog synced');
    } catch {
      toast.error('Failed to sync menu');
    } finally {
      setTimeout(() => setIsSyncing(false), 400);
    }
  };

  return (
    <MenuTable
      items={items}
      categories={categories}
      outletId={outletId}
      isSyncing={isSyncing}
      loading={menuQuery.isLoading && items.length === 0}
      onSync={handleManualSync}
      onRefresh={() => {
        menuQuery.refetch();
        categoriesQuery.refetch();
      }}
    />
  );
}
