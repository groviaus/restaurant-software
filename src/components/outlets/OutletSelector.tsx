'use client';

import { useState, useEffect } from 'react';
import { useOutlet } from '@/hooks/useOutlet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Store, Loader2, ChevronDown, Check } from 'lucide-react';
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
        disabled={switching || outlets.length === 0}
          className={cn(
              'w-[180px] sm:w-[200px] h-9 justify-between',
            switching && 'opacity-50 cursor-not-allowed'
          )}
        >
            <span className="truncate">
            {currentOutlet ? (
                currentOutlet.name
            ) : (
                <span className="text-gray-500">Select outlet</span>
            )}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          side="bottom" 
          sideOffset={4}
          align="end"
          className="w-[180px] sm:w-[200px]"
        >
          {outlets.length === 0 ? (
            <DropdownMenuItem disabled>
              No outlets available
            </DropdownMenuItem>
          ) : (
            outlets.map((outlet) => (
              <DropdownMenuItem
                key={outlet.id}
                onClick={() => handleSwitch(outlet.id)}
                className="flex items-center justify-between"
              >
                <span className="truncate">{outlet.name}</span>
                  {outlet.id === currentOutletId && (
                  <Check className="h-4 w-4 text-blue-600 ml-2" />
                  )}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {switching && (
        <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
      )}
    </div>
  );
}

