'use client';

import { useState, useEffect, useRef } from 'react';
import { useOutlet } from '@/hooks/useOutlet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Store, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OutletSelector() {
  const { currentOutletId, outlets, switchOutlet, isAdmin } = useOutlet();
  const [switching, setSwitching] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Outlets are loaded by useOutlet hook, just update loading state
    if (isAdmin) {
      // If outlets are already loaded, set loading to false
      if (outlets.length > 0) {
        setLoading(false);
      } else {
        // Wait a bit for outlets to load, then set loading to false
        const timer = setTimeout(() => setLoading(false), 500);
        return () => clearTimeout(timer);
      }
    } else {
      setLoading(false);
    }
  }, [isAdmin, outlets.length]);

  // Don't show for non-admins
  if (!isAdmin) {
    return null;
  }

  const handleSwitch = async (newOutletId: string) => {
    if (newOutletId === currentOutletId || switching) {
      return;
    }

    setSwitching(true);
    try {
      await switchOutlet(newOutletId);
    } catch (error) {
      console.error('Failed to switch outlet:', error);
      // Optionally show toast notification here
    } finally {
      setSwitching(false);
    }
  };

  const currentOutlet = outlets.find((outlet) => outlet.id === currentOutletId);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
        <span className="text-sm text-gray-500">Loading outlets...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Store className="h-4 w-4 text-gray-600" />
      <Select
        value={currentOutletId || ''}
        onValueChange={handleSwitch}
        disabled={switching || outlets.length === 0}
      >
        <SelectTrigger
          className={cn(
            'w-[180px] sm:w-[200px] h-9',
            switching && 'opacity-50 cursor-not-allowed'
          )}
        >
          <SelectValue placeholder="Select outlet">
            {currentOutlet ? (
              <span className="truncate">{currentOutlet.name}</span>
            ) : (
              <span className="text-gray-500">No outlet</span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {outlets.length === 0 ? (
            <SelectItem value="no-outlets" disabled>
              No outlets available
            </SelectItem>
          ) : (
            outlets.map((outlet) => (
              <SelectItem key={outlet.id} value={outlet.id}>
                <div className="flex items-center gap-2">
                  <span>{outlet.name}</span>
                  {outlet.id === currentOutletId && (
                    <span className="text-xs text-blue-600">(Active)</span>
                  )}
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      {switching && (
        <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
      )}
    </div>
  );
}

